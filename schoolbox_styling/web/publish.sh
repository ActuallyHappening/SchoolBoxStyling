set -exu

./build

readonly VERSION=$1

cd ..
cd build
# zip the web/* folder into  ../v1.7.7+release1.zip
zip -r ../../v${VERSION}+uncatagorized.zip *
