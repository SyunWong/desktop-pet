import Cocoa
import WebKit
import AVFoundation

final class Grip: NSTextField {
    override func mouseDown(with event: NSEvent) { window?.performDrag(with: event) }
}
final class Companion: NSObject, NSApplicationDelegate, WKUIDelegate, WKScriptMessageHandler {
    var panel: NSPanel!
    var web: WKWebView!
    let server = Process()
    var attempts = 0
    let port = Int.random(in: 43000...54000)
    var url: URL { URL(string: "http://127.0.0.1:\(port)/")! }
    let engine = AVAudioEngine()
    let speaker = AVAudioPlayerNode()
    var pcmFormat: AVAudioFormat?
    func stopAudio() {
        speaker.stop()
        engine.stop()
        if pcmFormat != nil { engine.disconnectNodeOutput(speaker); pcmFormat = nil }
    }
    func userContentController(_ controller: WKUserContentController, didReceive message: WKScriptMessage) {
        let origin = message.frameInfo.securityOrigin
        guard message.frameInfo.isMainFrame, origin.host == "127.0.0.1", origin.port == port else { return }
        if message.body as? String == "stop" { stopAudio(); return }
        guard let frame = message.body as? [String:Any], let rate = frame["rate"] as? Double,
              (8000...96000).contains(rate), let encoded = frame["pcm"] as? String,
              encoded.count <= 32768, let data = Data(base64Encoded: encoded),
              !data.isEmpty, data.count % 4 == 0 else { return }
        if pcmFormat?.sampleRate != rate {
            stopAudio()
            guard let format = AVAudioFormat(standardFormatWithSampleRate:rate, channels:1) else { return }
            engine.connect(speaker, to:engine.mainMixerNode, format:format)
            pcmFormat = format
        }
        guard let format = pcmFormat, let buffer = AVAudioPCMBuffer(pcmFormat:format, frameCapacity:AVAudioFrameCount(data.count/4)),
              let dest = buffer.floatChannelData?[0] else { return }
        buffer.frameLength = buffer.frameCapacity
        _ = data.copyBytes(to:UnsafeMutableRawBufferPointer(start:dest,count:data.count))
        do {
            if !engine.isRunning { try engine.start() }
            speaker.scheduleBuffer(buffer)
            if !speaker.isPlaying { speaker.play() }
        } catch { stopAudio() }
    }
    func applicationDidFinishLaunching(_ notification: Notification) {
        let root = Bundle.main.bundleURL.deletingLastPathComponent()
        let voice = root.appendingPathComponent("voice")
        let frame = NSScreen.main!.visibleFrame
        panel = NSPanel(contentRect: NSRect(x:frame.maxX-250,y:frame.minY+32,width:228,height:275),styleMask:[.borderless,.nonactivatingPanel],backing:.buffered,defer:false)
        panel.isOpaque=false; panel.backgroundColor = .clear; panel.level = .floating
        panel.hidesOnDeactivate=false; panel.collectionBehavior=[.canJoinAllSpaces,.fullScreenAuxiliary]
        let cfg = WKWebViewConfiguration()
        engine.attach(speaker)
        cfg.userContentController.add(self, name:"whaleAudio")
        cfg.mediaTypesRequiringUserActionForPlayback = []
        web = WKWebView(frame:NSRect(x:0,y:0,width:228,height:251),configuration:cfg)
        web.setValue(false, forKey:"drawsBackground"); web.uiDelegate=self
        panel.contentView!.addSubview(web)
        let handle = Grip(labelWithString:"DeepSeek-chan")
        handle.frame = NSRect(x:44,y:248,width:116,height:22)
        handle.alignment = .center; handle.textColor = .white; handle.wantsLayer=true
        handle.layer?.backgroundColor=NSColor.darkGray.cgColor; handle.layer?.cornerRadius=9
        panel.contentView!.addSubview(handle)
        let close=NSButton(title:"×",target:NSApp,action:#selector(NSApplication.terminate(_:)))
        close.frame=NSRect(x:165,y:245,width:32,height:27);panel.contentView!.addSubview(close)
        panel.orderFrontRegardless()
        message("Waking up…")
        let node = Bundle.main.object(forInfoDictionaryKey:"WhaleNode") as! String
        server.executableURL=URL(fileURLWithPath:node); server.currentDirectoryURL=voice
        server.arguments=["node_modules/next/dist/bin/next","dev","--webpack","--hostname","127.0.0.1","--port",String(port)]
        var env=ProcessInfo.processInfo.environment
        env["PATH"]=URL(fileURLWithPath:node).deletingLastPathComponent().path+":"+(env["PATH"] ?? "/usr/bin:/bin")
        env["NEXT_TELEMETRY_DISABLED"]="1";server.environment=env
        let log=root.appendingPathComponent("desktop.log")
        FileManager.default.createFile(atPath:log.path,contents:nil)
        if let out=try? FileHandle(forWritingTo:log){ server.standardOutput=out;server.standardError=out }
        do {try server.run();poll()} catch {message("Could not start. Please reopen.")}
    }
    func message(_ text:String) {
        let asset=Bundle.main.bundleURL.deletingLastPathComponent().appendingPathComponent("voice/public/whale.png")
        let data=(try? Data(contentsOf:asset))?.base64EncodedString() ?? ""
        let html="<body style='text-align:center;color:white;font:13px system-ui'><img height='166' src='data:image/png;base64,"+data+"'><p style='background:#203c56;padding:6px;border-radius:12px'>"+text+"</p></body>"
        web.loadHTMLString(html,baseURL:nil)
    }
    func poll() {
        guard server.isRunning, attempts < 100 else {message("Could not start. Please reopen.");return}
        attempts += 1
        URLSession.shared.dataTask(with:url.appendingPathComponent("whale.png")) { _,response,_ in
            DispatchQueue.main.async {
                if (response as? HTTPURLResponse)?.statusCode == 200 {self.web.load(URLRequest(url:self.url))}
                else { DispatchQueue.main.asyncAfter(deadline:.now()+0.6){self.poll()} }
            }
        }.resume()
    }
    func webView(_ webView:WKWebView, requestMediaCapturePermissionFor origin:WKSecurityOrigin, initiatedByFrame frame:WKFrameInfo, type:WKMediaCaptureType, decisionHandler:@escaping (WKPermissionDecision)->Void) {
        guard type == .microphone, origin.host == "127.0.0.1", origin.port == port else {decisionHandler(.deny);return}
        AVCaptureDevice.requestAccess(for:.audio){ allowed in DispatchQueue.main.async {decisionHandler(allowed ? .grant : .deny)} }
    }
    func applicationWillTerminate(_ notification:Notification){ if server.isRunning {server.interrupt()} }
}
let application=NSApplication.shared
let companion=Companion()
application.delegate=companion; application.setActivationPolicy(.accessory); application.run()
