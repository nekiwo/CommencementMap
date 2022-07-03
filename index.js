const fs = require("fs");
const {createCanvas, loadImage} = require("canvas");
const NodeGeocoder = require("node-geocoder");


const renderWidth = 2560; // Render dimensions
const renderHeight = 2560;
const maxEntries = 1500; // Max city entries (out of ~5900)

// Initiate canvas
const canvas = createCanvas(renderWidth, renderHeight);
const ctx = canvas.getContext("2d");

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
        const citiesRaw = data
            .split(/[•.\r\n]/)
            .filter(s => 
                s.indexOf(",") > -1 && 
                s.indexOf(":") === -1 &&
                s[0] === " " &&
                s.length < 30 && 
                s.slice(-1) != ",")
            .map(s => s.slice(1))
            .slice(0, maxEntries);

        citiesRaw.forEach(cityName => {
            if (cities[cityName] != undefined) {
                cities[cityName]++;
            } else {
                cities[cityName] = 1;
            }
        });

        // Initiate geocoder
        const geocoder = NodeGeocoder({
            provider: "tomtom", //"opencage", //"openstreetmap",
            apiKey: await fs.promises.readFile("apikey.txt", "utf8")
        });

        // Convert cities to coords
        let coords = [];
        for (const key in cities) {
            try {
                let res = await geocoder.geocode(key);
                if (res[0] != undefined) {
                    coords.push([[res[0].latitude, res[0].longitude], cities[key]]);
                    console.log([res[0].latitude, res[0].longitude])
                }
            } catch (err) {
                console.log(err);
            }
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
            ctx.arc(point[0], point[1], size * (renderWidth / 1000), 0, 2 * Math.PI, false);
            ctx.fillStyle = "rgba(255, 92, 92, 0.5)"//"#ff5c5c";
            ctx.fill();
        });

        // Save image
        fs.writeFileSync("result/image.png", canvas.toBuffer("image/png"));
        console.log("Done!");
    });
});