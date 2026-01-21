import { SCREEN_W, SCREEN_H } from './constants.js';

export function createStarfield() {
  const starfield = document.getElementById('starfield');
  const numStars = 200;

  for (let i = 0; i < numStars; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 2 + 's';
    starfield.appendChild(star);
  }
}

export function createPlane(world) {
  const plane = document.createElement("div");
  plane.className = "plane";
  plane.style.width = (SCREEN_W * 0.8) + "px";
  plane.style.height = (450 * 1.5) + "px";
  plane.style.background = "url('items/plane.png') no-repeat center/contain";
  plane.style.position = "absolute";
  plane.style.left = ((SCREEN_W - SCREEN_W * 0.8) / 2) + "px";
  plane.style.top = ((SCREEN_H - 450 * 1.5) / 2) + "px";
  plane.style.zIndex = "-1";
  world.appendChild(plane);
}

export function createCloudLayers(world) {
  // Add animated cloud layers
  const cloudLayer1 = document.createElement("div");
  cloudLayer1.className = "cloud-layer layer1";
  world.appendChild(cloudLayer1);

  const cloudLayer2 = document.createElement("div");
  cloudLayer2.className = "cloud-layer layer2";
  world.appendChild(cloudLayer2);

  const cloudLayer3 = document.createElement("div");
  cloudLayer3.className = "cloud-layer layer3";
  world.appendChild(cloudLayer3);

  // Populate layers with clouds
  for (let i = 0; i < 15; i++) {
    const cloud = document.createElement("div");
    cloud.className = "animated-cloud";
    cloud.style.left = (i * 300) + "px";
    cloud.style.top = Math.random() * 800 + "px";
    cloudLayer1.appendChild(cloud);
  }

  for (let i = 0; i < 12; i++) {
    const cloud = document.createElement("div");
    cloud.className = "animated-cloud";
    cloud.style.left = (i * 350) + "px";
    cloud.style.top = Math.random() * 600 + "px";
    cloudLayer2.appendChild(cloud);
  }

  for (let i = 0; i < 10; i++) {
    const cloud = document.createElement("div");
    cloud.className = "animated-cloud";
    cloud.style.left = (i * 400) + "px";
    cloud.style.top = Math.random() * 400 + "px";
  }
}