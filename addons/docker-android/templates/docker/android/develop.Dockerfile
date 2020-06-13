# Can't use alpine since it can't run 32-bit binaries, and the SDK doesn't have
# 64-bit binaries
FROM ubuntu:20.04

ARG VERSION_SDK_TOOLS=4333796
ARG NODE_VERSION=12.x
ARG TINI_VERSION=v0.18.0
ARG USERNAME=dev
ARG UID=1000
ARG USER_BIN_DIR=/home/$USERNAME/.bin

ENV JAVA8_HOME /usr/lib/jvm/java-8-openjdk-amd64
ENV JAVA_HOME $JAVA8_HOME
ENV ANDROID_HOME /opt/android-sdk-linux
ENV ANDROID_SDK_ZIP http://dl.google.com/android/repository/sdk-tools-linux-$VERSION_SDK_TOOLS.zip

ENV PATH $PATH:$ANDROID_HOME/tools:$ANDROID_HOME/tools/bin:$ANDROID_HOME/platform-tools

ENV XDG_RUNTIME_DIR /run/user/$UID
ENV PATH $USER_BIN_DIR:$PATH
ENV PROJECT_MOUNT=/project

# Tell gradle to store dependencies in a sub directory of the android project -
# this persists the dependencies between builds, speeding up build times. Make
# sure to add android/gradle_deps to the project's .gitignore
ENV GRADLE_USER_HOME $PROJECT_MOUNT/android/gradle_deps

RUN apt-get update -q

# Install Android SDK
## Dependencies
RUN apt-get install -y unzip gnupg2 curl ca-certificates openjdk-8-jdk

## SDK tools
RUN mkdir -p $ANDROID_HOME && \
    curl -L $ANDROID_SDK_ZIP --output sdk.zip && \
    unzip sdk.zip -d $ANDROID_HOME && \
    rm sdk.zip

## SDK
### sdkmanager will throw up warnings if this file does not exist
### TODO find out what this is needed for
RUN mkdir -p /root/.android && touch /root/.android/repositories.cfg
### Use verbose flags to keep an eye on progress - some commands take a very long
### time, and without the verbose flag it's impossible to tell if it's hung or
### still working
RUN yes | sdkmanager --verbose 'platform-tools'
RUN yes | sdkmanager --verbose 'emulator'
RUN yes | sdkmanager --verbose 'extras;android;m2repository'
RUN yes | sdkmanager --verbose 'extras;google;google_play_services'
RUN yes | sdkmanager --verbose 'extras;google;m2repository'
RUN yes | sdkmanager --verbose 'build-tools;23.0.1'
RUN yes | sdkmanager --verbose 'platforms;android-23'
RUN yes | sdkmanager --verbose 'system-images;android-23;default;x86_64'

RUN yes | sdkmanager --update --verbose
RUN yes | sdkmanager --licenses
# Done installing Android SDK

# Set up Ionic

## Install node, yarn and ionic
### install nodejs and yarn packages from nodesource and yarn apt sources
RUN echo "deb https://deb.nodesource.com/node_${NODE_VERSION} stretch main" > /etc/apt/sources.list.d/nodesource.list && \
    echo "deb https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list && \
    curl -sS https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add - && \
    apt-get update -qq && \
    apt-get install -qq -y --no-install-recommends nodejs yarn && \
    rm -rf /var/lib/apt/lists/*

RUN yarn global add @ionic/cli

RUN apt-get update -q

## Install watchman - required for Ionic to build native code, and for
## hot code reloading
RUN apt-get install -y git libssl-dev autoconf automake libtool python-dev pkg-config
RUN git clone https://github.com/facebook/watchman.git && \
    cd watchman && \
    git checkout v4.9.0 && \
    ./autogen.sh && \
    ./configure && \
    make && \
    make install && \
    cd .. && \
    rm -rf watchman
# Done setting up

# Install and set up Tini
ADD https://github.com/krallin/tini/releases/download/${TINI_VERSION}/tini /tini
RUN chmod +x /tini

ENTRYPOINT ["/tini", "--"]
# Done installing Tini

# Set up non-root user
RUN adduser --uid $UID --disabled-password --gecos '' $USERNAME
## Give the user ownership of the SDK installation directory (so it can run
## SDK commands)
RUN chown -R $USERNAME:$USERNAME $ANDROID_HOME
# Allow the Docker user to play audio through the host's pulseaudio
RUN mkdir -p $XDG_RUNTIME_DIR && chown -R $USERNAME:$USERNAME $XDG_RUNTIME_DIR
## No need for root from here on out, so switch to the non-root user to avoid
## complication (eg. having to chown more files due to creating as root, etc.)
USER $USERNAME
## emulator has a bug where it won't work unless run from a specific
## directory, so set up a convenience function to run it from anywhere. Can't
## use eg. .bashrc because tini doesn't load it

RUN mkdir $USER_BIN_DIR && \
    echo '(cd "$ANDROID_HOME"/tools && ./emulator "$@")' >> $USER_BIN_DIR/emulator && \
    chmod +x $USER_BIN_DIR/emulator
# Done setting up non-root user

WORKDIR $PROJECT_MOUNT
