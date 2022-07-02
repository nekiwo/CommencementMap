const fs = require("fs");
const {createCanvas, loadImage} = require("canvas");
const NodeGeocoder = require("node-geocoder");

// Render dimensions
const renderWidth = 2560;
const renderHeight = 2560;

// Initiate canvas
const canvas = createCanvas(renderWidth, renderHeight);
const ctx = canvas.getContext("2d");

// Initiate geocodeer
const geocoder = NodeGeocoder({
    provider: "openstreetmap"
});

// Background color
ctx.fillStyle = "#cccccc";
ctx.fillRect(0, 0, renderWidth, renderHeight);

// Load map

loadImage("img/Mercator_Projection.png").then(image => {
    /* Sources: 
     * - https://commons.wikimedia.org/wiki/File:Mercator_Projection.svg
     * - https://wiki.openstreetmap.org/wiki/Slippy_map_tilenames
     * - https://tile.openstreetmap.org/0/0/0.png
     */
    ctx.drawImage(image, 0, 0, renderWidth, renderHeight);

    // Scrape cities from PDF
    
    fs.readFile("pdf/c2020.txt", "utf8", async (err, data) => {
        if (err) throw err;

        let cities = {};
        const citiesRaw = data.split(/[•.\r\n]/).filter(s => s.indexOf(",") > -1).map(s => s.slice(1));
        console.log(citiesRaw.length)
        let t = 0
        citiesRaw.forEach(cityName => {
            t++
            if (t < 1500) {
                if (cities[cityName] != undefined) {
                    cities[cityName]++;
                } else {
                    cities[cityName] = 1;
                }
            }
        });
        t = 0

        // Convert cities to coords
        let coords = [];
        for (const key in cities) {
            let res = await geocoder.geocode(key);
            if (res[0] != undefined) {
                coords.push([[res[0].latitude, res[0].longitude], cities[key]]);
            }
            t++
            console.log(t)
        }

        // Convert coords to points
        let points = [];
        coords.forEach(coordData => {
            const lat = coordData[0][0];
            const lon = coordData[0][1];

            const zoom = 0;

            const rad = deg => deg * (Math.PI / 180);
            const x = (renderWidth / (2 * Math.PI)) * Math.pow(2, zoom) * (rad(lon) + Math.PI);
            const y = (renderHeight / (2 * Math.PI)) * Math.pow(2, zoom) * (Math.PI - Math.log(Math.tan(Math.PI / 4 + rad(lat) / 2)));

            points.push([[x, y], coordData[1]]);
        });


        // Plot points
        points.forEach(pointData => {
            const point = pointData[0];
            const size = pointData[1];

            ctx.beginPath();
            ctx.arc(point[0], point[1], size * (renderWidth / 500), 0, 2 * Math.PI, false);
            ctx.fillStyle = "#ff5c5c";
            ctx.fill();
        });

        fs.writeFileSync("result/image.png", canvas.toBuffer("image/png"));
        console.log("Done!");
    });
});