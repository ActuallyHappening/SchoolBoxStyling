
## Macos setup
Install tsc:
`brew install yarn`
`yarn global add typescript`

Install flutter:
`brew install flutter`

## Linux (pop!OS) setup
```sh
# install npm
sudo apt install npm

# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
export NVM_DIR="$([ -z "${XDG_CONFIG_HOME-}" ] && printf %s "${HOME}/.nvm" || printf %s "${XDG_CONFIG_HOME}/nvm")"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" # This loads nvm

# install node using nvm (or any other installation method)
nvm install node

# install typescript
npm i -g typescript
```

## Build:

```sh
cd web
npm i
./build
```
<!-- `cd web && ./build` -->
Outputted files in `build/web`
You can run the publish.sh script:
```sh
cd web
./publish.sh 1.7.10
```
