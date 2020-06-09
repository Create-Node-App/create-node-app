# APK Generation

In this document you can find some things to take into account the process of generating an APK, a bundle or any result of running a gradlew task.

They were taken into account when defining the docker configuration of the `android/deploy.Dockerfile` file present in this directory.

## Docker

```sh
$ docker image build -t agora-deploy:latest -f ./docker/android/deploy.Dockerfile .
$ docker run --rm --name rn-build -v $PWD:/usr/src/app -w /usr/src/app agora-deploy /bin/sh -c \
   "yarn && yarn build:prod && yarn prepare:android && cd android && ./gradlew build && ./gradlew bundleRelease"
```

* * *

# Explanation

## Steps

- add the following to the `android/gradlew`

```sh
yes | $ANDROID_HOME/tools/bin/sdkmanager "platforms;android-28"
yes | $ANDROID_HOME/tools/bin/sdkmanager "build-tools;28.0.3"
```

- If there is problem with the licenses in a task process, you can do the following on your terminal emulator:

```sh
$ yes | $ANDROID_HOME/tools/bin/sdkmanager --licenses
```

## Gradlew

```sh
$ cd android/
```

### View the gradlew tasks

```sh
$ ./gradlew tasks
```

### Build debug apk

```sh
./gradlew buildDebug
```

or,

```sh
$ ./gradlew buildDebug
```

### Build release

```sh
$ cd app/
$ keytool -genkey -v -keystore <release_key_file> -alias <release-key-alias> -keyalg RSA -keysize 2048 -validity 10000
```

Then update the content of the file `android/gradle.properties`.

- - -

```sh
$ ./gradlew build
$ ./gradlew bundleRelease
```
