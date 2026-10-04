package com.miravoicedemo

import android.app.Application
import com.facebook.react.PackageList
import com.facebook.react.ReactApplication
import com.facebook.react.ReactHost
import com.facebook.react.ReactNativeApplicationEntryPoint.loadReactNative
import com.facebook.react.defaults.DefaultReactHost.getDefaultReactHost
// TODO(L2-02a): import com.livekit.reactnative.LiveKitReactNative and com.livekit.reactnative.audio.AudioType
// TODO(L2-02a)

class MainApplication : Application(), ReactApplication {

  override val reactHost: ReactHost by lazy {
    getDefaultReactHost(
      context = applicationContext,
      packageList =
        PackageList(this).packages.apply {
          // Packages that cannot be autolinked yet can be added manually here, for example:
          // add(MyReactNativePackage())
        },
    )
  }

  override fun onCreate() {
    // TODO(L2-02b): Call LiveKitReactNative.setup(this, AudioType.CommunicationAudioType()) BEFORE super.onCreate().
    //   CommunicationAudioType = voice-call mode: hardware echo cancellation (AEC) on, routes to earpiece/speaker correctly.
    //   Common mistake: MediaAudioType for a 2-way voice app → the agent hears itself and interrupts itself.
    // TODO(L2-02b)
    super.onCreate()
    loadReactNative(this)
  }
}
