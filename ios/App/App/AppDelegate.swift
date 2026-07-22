import UIKit
import Capacitor
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, MessagingDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        // Firebase 초기화 (GoogleService-Info.plist 필요)
        FirebaseApp.configure()
        
        // Firebase Messaging 대리자 설정
        Messaging.messaging().delegate = self
        
        return true
    }

    // MARK: - APNs 토큰 → Firebase Messaging 전달
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        // APNs 토큰을 Firebase Messaging에 전달 → FCM registration token 생성
        Messaging.messaging().apnsToken = deviceToken
        
        // Capacitor 플러그인에도 전달 (기존 동작 유지)
        NotificationCenter.default.post(name: .capacitorDidRegisterForRemoteNotifications, object: deviceToken)
    }

    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        NotificationCenter.default.post(name: .capacitorDidFailToRegisterForRemoteNotifications, object: error)
    }

    // MARK: - Firebase MessagingDelegate → FCM 토큰 수신
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        guard let token = fcmToken else { return }
        print("[WoC] FCM registration token received: \(token.prefix(20))...")
        
        // FCM 토큰을 WebView의 localStorage에 주입하여 JavaScript에서 접근 가능하게 함
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
            self?.injectFcmTokenToWebView(token: token)
        }
    }
    
    /// FCM 토큰을 WebView localStorage에 저장하고 커스텀 이벤트를 발행
    private func injectFcmTokenToWebView(token: String) {
        guard let rootVC = window?.rootViewController else { return }
        
        // CAPBridgeViewController의 webView 접근
        if let bridgeVC = rootVC as? CAPBridgeViewController,
           let webView = bridgeVC.bridge?.webView {
            let js = """
            window.localStorage.setItem('__ios_fcm_token__', '\(token)');
            window.dispatchEvent(new CustomEvent('fcmTokenReady', { detail: { token: '\(token)' } }));
            """
            webView.evaluateJavaScript(js) { _, error in
                if let error = error {
                    print("[WoC] Failed to inject FCM token: \(error.localizedDescription)")
                } else {
                    print("[WoC] FCM token injected to webView successfully")
                }
            }
        }
    }

    // MARK: - Lifecycle
    func applicationWillResignActive(_ application: UIApplication) {}
    func applicationDidEnterBackground(_ application: UIApplication) {}
    func applicationWillEnterForeground(_ application: UIApplication) {}
    func applicationDidBecomeActive(_ application: UIApplication) {}
    func applicationWillTerminate(_ application: UIApplication) {}

    // MARK: - URL Handling
    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
