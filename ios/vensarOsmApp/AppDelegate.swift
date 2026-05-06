import Expo
import React
import ReactAppDependencyProvider
import UIKit

@UIApplicationMain
public class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  private var privacyShieldView: UIView?
  private var captureShieldView: UIView?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory
    bindReactNativeFactory(factory)

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)

#if !DEBUG
    configureScreenProtection()
#endif
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  // Linking API
  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    return super.application(app, open: url, options: options) || RCTLinkingManager.application(app, open: url, options: options)
  }

  // Universal Links
  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {
    let result = RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler) || result
  }

  private func configureScreenProtection() {
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppWillResignActive),
      name: UIApplication.willResignActiveNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleAppDidBecomeActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleScreenCaptureChanged),
      name: UIScreen.capturedDidChangeNotification,
      object: nil
    )

    updateCaptureShield()
  }

  @objc
  private func handleAppWillResignActive() {
    showPrivacyShield()
  }

  @objc
  private func handleAppDidBecomeActive() {
    hidePrivacyShield()
    updateCaptureShield()
  }

  @objc
  private func handleScreenCaptureChanged() {
    updateCaptureShield()
  }

  private func makeShieldView(message: String) -> UIView {
    let shieldView = UIView()
    shieldView.backgroundColor = UIColor(red: 0.95, green: 0.97, blue: 1.0, alpha: 1.0)
    shieldView.translatesAutoresizingMaskIntoConstraints = false

    let label = UILabel()
    label.translatesAutoresizingMaskIntoConstraints = false
    label.text = message
    label.textColor = UIColor(red: 0.11, green: 0.19, blue: 0.36, alpha: 1.0)
    label.font = UIFont.systemFont(ofSize: 18, weight: .semibold)
    label.textAlignment = .center
    label.numberOfLines = 0

    shieldView.addSubview(label)

    NSLayoutConstraint.activate([
      label.centerXAnchor.constraint(equalTo: shieldView.centerXAnchor),
      label.centerYAnchor.constraint(equalTo: shieldView.centerYAnchor),
      label.leadingAnchor.constraint(greaterThanOrEqualTo: shieldView.leadingAnchor, constant: 24),
      label.trailingAnchor.constraint(lessThanOrEqualTo: shieldView.trailingAnchor, constant: -24)
    ])

    return shieldView
  }

  private func pinShieldToWindow(_ shieldView: UIView) {
    guard let window else { return }

    window.addSubview(shieldView)
    NSLayoutConstraint.activate([
      shieldView.leadingAnchor.constraint(equalTo: window.leadingAnchor),
      shieldView.trailingAnchor.constraint(equalTo: window.trailingAnchor),
      shieldView.topAnchor.constraint(equalTo: window.topAnchor),
      shieldView.bottomAnchor.constraint(equalTo: window.bottomAnchor)
    ])
  }

  private func showPrivacyShield() {
    guard let window else { return }

    if privacyShieldView == nil {
      privacyShieldView = makeShieldView(message: "Protected Screen")
    }

    guard let privacyShieldView else { return }

    if privacyShieldView.superview == nil {
      pinShieldToWindow(privacyShieldView)
    }

    window.bringSubviewToFront(privacyShieldView)
  }

  private func hidePrivacyShield() {
    privacyShieldView?.removeFromSuperview()
  }

  private func updateCaptureShield() {
    guard let window else { return }

    if UIScreen.main.isCaptured {
      if captureShieldView == nil {
        captureShieldView = makeShieldView(message: "Screen Recording Disabled")
      }

      guard let captureShieldView else { return }

      if captureShieldView.superview == nil {
        pinShieldToWindow(captureShieldView)
      }

      window.bringSubviewToFront(captureShieldView)
      return
    }

    captureShieldView?.removeFromSuperview()
  }
}

class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {
  // Extension point for config-plugins

  override func sourceURL(for bridge: RCTBridge) -> URL? {
    // needed to return the correct URL for expo-dev-client.
    bridge.bundleURL ?? bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    return RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: ".expo/.virtual-metro-entry")
#else
    return Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
