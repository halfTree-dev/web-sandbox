const lowerBlockImages = {};
const upperBlockImages = {};
const entityImages = {};

function loadImagesFromManifest(manifestPath, targetDict) {
    fetch(manifestPath)
        .then(response => response.json())
        .then(data => {
            data.assets.forEach(asset => {
                targetDict[asset.id] = {};
                asset.src.forEach(variant => {
                    const img = new Image();
                    img.src = variant.src;
                    targetDict[asset.id][variant.mutate] = img;
                });
            });
        })
        .catch(error => console.error(`读取清单资源文件失败 ${manifestPath}:`, error));
}

loadImagesFromManifest('/assets/blocks/lower/manifest.json', lowerBlockImages);
loadImagesFromManifest('/assets/blocks/upper/manifest.json', upperBlockImages);
loadImagesFromManifest('/assets/entity/manifest.json', entityImages);

function searchImage(images, name, mutate) {
    if (images[name]) {
        if (images[name][mutate]) {
            return images[name][mutate];
        }
        else if (images[name][0]) {
            return images[name][0];
        }
    }
    return null;
}

const selectImage = new Image();
selectImage.src = '/assets/hud/select.png';

const playerImage = new Image();
playerImage.src = '/assets/player/player_idle.png';