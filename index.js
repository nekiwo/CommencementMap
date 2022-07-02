const fs = require("fs")
const {createCanvas, loadImage} = require("canvas");
const NodeGeocoder = require('node-geocoder');

// Render dimensions
const renderWidth = 2580;
const renderHeight = 1892;

// Initiate canvas
const canvas = createCanvas(renderWidth, renderHeight);
const ctx = canvas.getContext("2d");

// Initiate geocodeer
const geocoder = NodeGeocoder({
    provider: 'openstreetmap'
});

// Background color
ctx.fillStyle = "#cccccc";
ctx.fillRect(0, 0, renderWidth, renderHeight);

// Load map
loadImage("img/Mercator_Projection.svg.png").then(image => {
    ctx.drawImage(image, 0, 0, renderWidth, renderHeight);

    // Scrape cities from PDF
    let cities = [
        ["Davis, California", 1],
        ["New York, New York", 5],
        ["Calgary, Canada", 3],
        ["Beirut, Lebanon", 1]
    ];

    // Convert cities to coords
    console.log("test1")
    let coords = (asyn)
    

    for (const cityData of cities) {
        geocoder.geocode(cityData[0]).then(res => {
            coords.push([[res[0].latitude, res[0].longitude], cityData[1]]);
            console.log("test2")
        });
    }
    console.log("test3")

    // Convert coords to points
    let points = [];
    coords.forEach(coordData => {
        const lat = coordData[0][0];
        const lon = coordData[0][1];

        const zoom = 1;

        const rad = deg => deg * (Math.PI / 180);
        const x = (renderWidth / (2 * Math.PI)) * Math.pow(2, zoom) * (rad(lon) + Math.PI);
        const y = (renderHeight / (2 * Math.PI)) * Math.pow(2, zoom) * (Math.PI - Math.log(Math.tan(math.PI / 4 + rad(lat) / 2)));

        console.log(lat, lon, x, y)

        points.push([[x, y], coordData[1]]);
    });


    // Plot points
    points.forEach(pointData => {
        const point = pointData[0];
        const size = pointData[1];

        ctx.beginPath();
        ctx.arc(point[0], point[1], size * (renderWidth / 300), 0, 2 * Math.PI, false);
        ctx.fillStyle = "#ff5c5c";
        ctx.fill();
    });

    fs.writeFileSync("./image.png", canvas.toBuffer("image/png"));
});