// make the license thingerybob

import { createCanvas, loadImage, registerFont } from "canvas";
import path from "path";
import { fileURLToPath } from "url";
import https from "https";
import http from "http";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

try {
  registerFont(path.join(__dirname, "Poppins-Bold.ttf"), { family: "Poppins" });
} catch (err) {
  console.error(
    "❌ The poppin font doesn't exist! Make sure to download it from Google.",
  );
}

async function loadImageFromUrl(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith("https") ? https : http;

    protocol
      .get(url, (response) => {
        if (
          response.statusCode >= 300 &&
          response.statusCode < 400 &&
          response.headers.location
        ) {
          loadImageFromUrl(response.headers.location)
            .then(resolve)
            .catch(reject);
          return;
        }

        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", async () => {
          try {
            const buffer = Buffer.concat(chunks);
            const image = await loadImage(buffer);
            resolve(image);
          } catch (err) {
            reject(err);
          }
        });
        response.on("error", reject);
      })
      .on("error", reject);
  });
}

async function generateLicenseImage({
  avatarUrl,
  username,
  memberNumber,
  joinDate,
}) {
  const backgroundPath = path.join(__dirname, "canoe.png");
  const background = await loadImage(backgroundPath);
  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(background, 0, 0);

  try {
    const avatar = await loadImageFromUrl(avatarUrl);
    ctx.drawImage(avatar, 17, 17, 163, 163);
  } catch (err) {
    console.error("❌ Error placing avatar:", err);
    // lame placeholder
    ctx.fillStyle = "#cccccc";
    ctx.fillRect(17, 17, 163, 163);
  }
  // put text on the ze lic
  ctx.fillStyle = "black";
  ctx.font = "bold 25px Poppins, Arial, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(String(memberNumber), 10, 295);
  ctx.fillText(joinDate, 10, 342);
  ctx.fillText(username, 10, 390);
  // this took 2 tries, surprising
  return canvas.toBuffer("image/jpeg");
}

function formatJoinDate(date) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Own",
  ];
  // imagine that i made up my own month
  const month = months[date.getMonth()];
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month} ${day} ${year}`;
}

export { generateLicenseImage, formatJoinDate, loadImageFromUrl };
