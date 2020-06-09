## Build docker

```sh
$ docker image build -t ionic-react:latest -f ./docker/android/develop.Dockerfile .
```

## Set up the helper script

This Docker image is most easily used by utilizing the `ionic-react` script available in
`scripts/`. `ionic-react` will take any command you give it and run it within a Ionic React
docker container. Alternatively, you can use `ionic-react bash` to drop into a shell for
interactive use.

Add the script to your path:

```sh
$ cp ./bin/ionic-react ~/bin/ionic-react
$ export PATH="$HOME/bin:$PATH"
```

Single command example:

```sh
$ ionic-react emulator -avd nexus5
```

Interactive shell example:

```sh
$ ionic-react bash
~> emulator -avd nexus5 &
...
~> yarn
~> ionic-react android
...
```

## Run project

Connect a physical or virtual android device (see [Caveats](#caveats) below),
then:

```sh
$ ionic-react ionic-react android
```

### Hot reload

```sh
$ ionic-react bash
~> watchman watch .
~> ionic-react android
```

Make sure to enable it in the debug menu on the device (see
[Caveats](#enabling-debug-features)).

# Caveats

## Giving Docker access to the display

Docker won't be able to run any GUI applications unless you give it permission
to use the host's display:

```sh
$ xhost local:docker
```

Or, on NixOS:

```sh
$ nix-shell -p xorg.xhost --run 'xhost local:docker'
```
This will need to be run each time the host is rebooted (or possibly at each
login, if on a multi-user machine?).

## Using a physical device

You'll need to install the android udev rules if you want to test the app on a
physical device (connected via USB). For NixOS users this is as simple as adding
`programs.adb.enable = true;` to your NixOS configuration. For non-NixOS users,
the following should work (warning: I have not tested this personally):

```sh
$ wget -S -O - http://source.android.com/source/51-android.rules | sed "s/<username>/$USER/" | sudo tee >/dev/null /etc/udev/rules.d/51-android.rules

$ sudo udevadm control --reload-rules
```

## Using an emulator

Available documentation (official or otherwise) on creating emulators on the
command line is sparse and not particularly clear, but the following should be
enough to create an Android Virtual Device for basic use.

First, get the list of built-in device definitions. In our case, we'll be trying
to create a Nexus 5 emulator, just to demonstrate.

```sh
$ ionic-react avdmanager list device
# ...
#     OEM : Google
# ---------
# id: 8 or "Nexus 5"
#     Name: Nexus 5
#     OEM : Google
# ---------
# id: 9 or "Nexus 5X"
# ...
```
So we want the device ID of `8`, or we can use `Nexus 5`. Now to create the AVD:

```sh
$ ionic-react avdmanager create avd --name nameOfAvd --package 'system-images;android-23;default;x86_64' --device "Nexus 5"
```

If asked if you want to create a custom hardware profile, say no (creating a
custom hardware profile asks a ton of detailed, technical questions that are
likely beyond the scope of most use cases). However, there is one hardware
profile tweak we will want to make - enabling keyboard support, so that you can
type into the emulator using your keyboard instead of the on-screen keyboard.

Once the AVD has been created, add keyboard support to its config.ini:

```
~~> echo "hw.keyboard=yes" >> ~/.android/avd/nameOfAvd.avd/config.ini
```

You're then ready to launch the emulator via:

```sh
$ ionic-react emulator -avd nameOfAvd
```