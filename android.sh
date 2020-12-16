#!/usr/bin/env sh

# abort on errors
set -e

# build (for the first time)
#ionic build

# update the android folder
ionic cap copy android

# open in Android Studio
ionic cap open android
