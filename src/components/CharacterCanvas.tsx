import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { CharacterGender } from '../types/game';
import { WARDROBE_CATALOG } from '../data/wardrobeCatalog';

interface CharacterCanvasProps {
  gender: CharacterGender;
  equipped: {
    clothes: string;
    shoes: string;
    heels: string;
    accessories: string;
  };
  isSpeaking: boolean;
  actionState?: 'idle' | 'happy' | 'wave' | 'spin' | 'eat' | 'bath';
  onCharacterClick?: (zone: 'head' | 'body' | 'feet') => void;
  roomTheme?: 'bedroom' | 'boutique' | 'balcony' | 'disco';
}

export const CharacterCanvas: React.FC<CharacterCanvasProps> = ({
  gender,
  equipped,
  isSpeaking,
  actionState = 'idle',
  onCharacterClick,
  roomTheme = 'bedroom',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const characterGroupRef = useRef<THREE.Group | null>(null);
  const headGroupRef = useRef<THREE.Group | null>(null);
  const mouthRef = useRef<THREE.Mesh | null>(null);
  const leftEyeRef = useRef<THREE.Mesh | null>(null);
  const rightEyeRef = useRef<THREE.Mesh | null>(null);
  const leftArmRef = useRef<THREE.Group | null>(null);
  const rightArmRef = useRef<THREE.Group | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Animation timeline state in ref
  const animTimeRef = useRef(0);
  const blinkTimerRef = useRef(0);
  const actionTimerRef = useRef(0);
  const currentActionRef = useRef(actionState);
  const targetRotationY = useRef(0);
  const isDraggingRef = useRef(false);
  const prevMouseXRef = useRef(0);

  useEffect(() => {
    currentActionRef.current = actionState;
    actionTimerRef.current = 0;
  }, [actionState]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.25, 4.2);
    cameraRef.current = camera;

    // Renderer setup with alpha
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffeedd, 1.4);
    mainLight.position.set(3, 5, 4);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 1024;
    mainLight.shadow.mapSize.height = 1024;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xff99c8, 0.8);
    fillLight.position.set(-3, 3, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x92c7cf, 1.0);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Floating Sparkle Particles
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 45;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 5;
      positions[i + 1] = Math.random() * 3.5 - 0.5;
      positions[i + 2] = (Math.random() - 0.5) * 4;

      const pColor = new THREE.Color().setHSL(0.9 + Math.random() * 0.2, 0.8, 0.7);
      colors[i] = pColor.r;
      colors[i + 1] = pColor.g;
      colors[i + 2] = pColor.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);
    particlesRef.current = particles;

    // Platform / Shadow plane
    const shadowGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.05, 32);
    const shadowMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.1,
    });
    const platform = new THREE.Mesh(shadowGeo, shadowMat);
    platform.position.y = -1.1;
    platform.receiveShadow = true;
    scene.add(platform);

    const ringGeo = new THREE.RingGeometry(1.25, 1.35, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xfc67a7,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -1.07;
    scene.add(ring);

    // Build the 3D Character Rig
    buildCharacter(scene, gender, equipped);

    // Mouse / Touch interaction handlers for rotation
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      isDraggingRef.current = true;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      prevMouseXRef.current = clientX;
    };

    const onPointerMove = (e: MouseEvent | TouchEvent) => {
      if (!isDraggingRef.current) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const deltaX = clientX - prevMouseXRef.current;
      targetRotationY.current += deltaX * 0.008;
      prevMouseXRef.current = clientX;
    };

    const onPointerUp = () => {
      isDraggingRef.current = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    // Raycaster for clicking character zones
    const raycaster = new THREE.Raycaster();
    const mouseVec = new THREE.Vector2();

    const handleCanvasClick = (event: MouseEvent) => {
      if (!containerRef.current || !cameraRef.current || !characterGroupRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      mouseVec.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseVec.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouseVec, cameraRef.current);
      const intersects = raycaster.intersectObjects(characterGroupRef.current.children, true);

      if (intersects.length > 0) {
        const hitPointY = intersects[0].point.y;
        if (hitPointY > 1.2) {
          onCharacterClick?.('head');
        } else if (hitPointY > 0.0) {
          onCharacterClick?.('body');
        } else {
          onCharacterClick?.('feet');
        }
      }
    };

    dom.addEventListener('click', handleCanvasClick);

    // Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container || !renderer || !camera) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    });
    resizeObserver.observe(container);

    // Animation Loop
    let reqId = 0;
    const clock = new THREE.Clock();

    const animate = () => {
      reqId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      animTimeRef.current += delta;
      blinkTimerRef.current += delta;
      actionTimerRef.current += delta;

      const time = animTimeRef.current;
      const charGroup = characterGroupRef.current;
      const head = headGroupRef.current;
      const mouth = mouthRef.current;
      const leftEye = leftEyeRef.current;
      const rightEye = rightEyeRef.current;
      const leftArm = leftArmRef.current;
      const rightArm = rightArmRef.current;

      if (charGroup) {
        // Smooth rotation damping
        charGroup.rotation.y += (targetRotationY.current - charGroup.rotation.y) * 0.08;

        // Base Idle breathing
        const breath = Math.sin(time * 2.2) * 0.025;
        charGroup.position.y = -0.9 + breath;

        // Head tilt & idle glance
        if (head) {
          head.rotation.z = Math.sin(time * 1.5) * 0.04;
          head.rotation.x = Math.sin(time * 0.9) * 0.03;
        }

        // Arm idle sway
        if (leftArm && rightArm) {
          if (currentActionRef.current === 'wave') {
            rightArm.rotation.z = Math.PI * 0.7 + Math.sin(time * 12) * 0.3;
            rightArm.rotation.x = Math.sin(time * 6) * 0.2;
            leftArm.rotation.z = 0.15 + Math.sin(time * 2) * 0.05;
          } else if (currentActionRef.current === 'happy' || currentActionRef.current === 'eat') {
            leftArm.rotation.z = 0.6 + Math.sin(time * 8) * 0.15;
            rightArm.rotation.z = 0.6 + Math.cos(time * 8) * 0.15;
          } else {
            leftArm.rotation.z = 0.15 + Math.sin(time * 2) * 0.04;
            rightArm.rotation.z = -0.15 - Math.sin(time * 2) * 0.04;
            leftArm.rotation.x = Math.sin(time * 1.5) * 0.05;
            rightArm.rotation.x = -Math.sin(time * 1.5) * 0.05;
          }
        }

        // Spin animation
        if (currentActionRef.current === 'spin') {
          charGroup.rotation.y += delta * 10;
          if (actionTimerRef.current > 1.2) {
            currentActionRef.current = 'idle';
          }
        }

        // Speaking mouth animation
        if (mouth) {
          if (isSpeaking) {
            const mouthScaleY = 0.8 + Math.abs(Math.sin(time * 16)) * 1.6;
            mouth.scale.set(1, mouthScaleY, 1);
          } else {
            mouth.scale.set(1, 1, 1);
          }
        }

        // Blinking system
        if (leftEye && rightEye) {
          if (blinkTimerRef.current > 3.5) {
            const blinkDuration = 0.18;
            const blinkProgress = (blinkTimerRef.current - 3.5) / blinkDuration;
            if (blinkProgress < 1) {
              const eyeScaleY = Math.max(0.1, 1 - Math.sin(blinkProgress * Math.PI));
              leftEye.scale.y = eyeScaleY;
              rightEye.scale.y = eyeScaleY;
            } else {
              leftEye.scale.y = 1;
              rightEye.scale.y = 1;
              blinkTimerRef.current = 0;
            }
          }
        }
      }

      // Sparkles slow float
      if (particlesRef.current) {
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] += delta * 0.15;
          if (positions[i] > 3.0) positions[i] = -0.5;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
        particlesRef.current.rotation.y = time * 0.03;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(reqId);
      resizeObserver.disconnect();
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('click', handleCanvasClick);
      if (container.contains(dom)) {
        container.removeChild(dom);
      }
      renderer.dispose();
    };
  }, [gender]);

  // Update wardrobe / equipped items on the 3D model without full scene reconstruction
  useEffect(() => {
    if (sceneRef.current) {
      buildCharacter(sceneRef.current, gender, equipped);
    }
  }, [equipped, gender]);

  // Helper to build 3D procedural cartoon model
  const buildCharacter = (
    scene: THREE.Scene,
    charGender: CharacterGender,
    currEquipped: CharacterCanvasProps['equipped']
  ) => {
    // Remove existing character group
    if (characterGroupRef.current) {
      scene.remove(characterGroupRef.current);
    }

    const charGroup = new THREE.Group();
    characterGroupRef.current = charGroup;

    // Retrieve active item definitions
    const clothesItem = WARDROBE_CATALOG.find((i) => i.id === currEquipped.clothes);
    const shoeItem =
      WARDROBE_CATALOG.find((i) => i.id === currEquipped.heels) ||
      WARDROBE_CATALOG.find((i) => i.id === currEquipped.shoes);
    const accItem = WARDROBE_CATALOG.find((i) => i.id === currEquipped.accessories);

    const skinColor = 0xffe2d2;
    const skinMat = new THREE.MeshStandardMaterial({
      color: skinColor,
      roughness: 0.5,
      metalness: 0.05,
    });

    const clothesColorHex = clothesItem ? parseInt(clothesItem.color.replace('#', '0x')) : 0xff99c8;
    const clothesSecColorHex = clothesItem?.secondaryColor
      ? parseInt(clothesItem.secondaryColor.replace('#', '0x'))
      : 0xffffff;

    const clothesMat = new THREE.MeshStandardMaterial({
      color: clothesColorHex,
      roughness: 0.4,
      metalness: 0.1,
    });

    const clothesSecMat = new THREE.MeshStandardMaterial({
      color: clothesSecColorHex,
      roughness: 0.3,
      metalness: 0.15,
    });

    // ----------------- 1. HEAD & FACE -----------------
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.48, 0);
    headGroupRef.current = headGroup;

    // Head base (smooth stylized rounded sphere)
    const headGeo = new THREE.SphereGeometry(0.38, 32, 32);
    headGeo.scale(1, 1.05, 0.95);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.castShadow = true;
    headGroup.add(headMesh);

    // Eyes
    const eyeWhiteGeo = new THREE.SphereGeometry(0.085, 24, 24);
    eyeWhiteGeo.scale(1, 1.25, 0.5);
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const pupilGeo = new THREE.SphereGeometry(0.05, 20, 20);
    pupilGeo.scale(1, 1.15, 0.4);
    const pupilColor = charGender === 'female' ? 0x2563eb : 0x059669;
    const pupilMat = new THREE.MeshBasicMaterial({ color: pupilColor });

    const glintGeo = new THREE.SphereGeometry(0.02, 12, 12);
    const glintMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    // Left Eye
    const leftEye = new THREE.Group();
    const lWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    const lPupil = new THREE.Mesh(pupilGeo, pupilMat);
    lPupil.position.set(0.01, 0, 0.05);
    const lGlint = new THREE.Mesh(glintGeo, glintMat);
    lGlint.position.set(0.02, 0.025, 0.07);
    leftEye.add(lWhite, lPupil, lGlint);
    leftEye.position.set(-0.14, 0.04, 0.3);
    leftEye.rotation.y = -0.12;
    headGroup.add(leftEye);
    leftEyeRef.current = lWhite;

    // Right Eye
    const rightEye = new THREE.Group();
    const rWhite = new THREE.Mesh(eyeWhiteGeo, eyeWhiteMat);
    const rPupil = new THREE.Mesh(pupilGeo, pupilMat);
    rPupil.position.set(-0.01, 0, 0.05);
    const rGlint = new THREE.Mesh(glintGeo, glintMat);
    rGlint.position.set(-0.005, 0.025, 0.07);
    rightEye.add(rWhite, rPupil, rGlint);
    rightEye.position.set(0.14, 0.04, 0.3);
    rightEye.rotation.y = 0.12;
    headGroup.add(rightEye);
    rightEyeRef.current = rWhite;

    // Rosy Blush Cheeks
    const blushGeo = new THREE.CircleGeometry(0.065, 16);
    const blushMat = new THREE.MeshBasicMaterial({
      color: 0xf472b6,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
    });
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.21, -0.06, 0.28);
    leftBlush.rotation.y = -0.35;
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.21, -0.06, 0.28);
    rightBlush.rotation.y = 0.35;
    headGroup.add(leftBlush, rightBlush);

    // Cute Smile / Talking Mouth
    const mouthGeo = new THREE.TorusGeometry(0.045, 0.012, 12, 24, Math.PI);
    const mouthMat = new THREE.MeshBasicMaterial({ color: 0xe11d48 });
    const mouth = new THREE.Mesh(mouthGeo, mouthMat);
    mouth.position.set(0, -0.14, 0.34);
    mouth.rotation.x = Math.PI;
    headGroup.add(mouth);
    mouthRef.current = mouth;

    // Cute Nose
    const noseGeo = new THREE.SphereGeometry(0.022, 16, 16);
    const noseMat = new THREE.MeshStandardMaterial({ color: 0xfbb6ce, roughness: 0.6 });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.04, 0.36);
    headGroup.add(nose);

    // Stylized Hair
    const hairColor = charGender === 'female' ? 0xffb703 : 0x47291a;
    const hairMat = new THREE.MeshStandardMaterial({
      color: hairColor,
      roughness: 0.45,
      metalness: 0.05,
    });

    if (charGender === 'female') {
      // Elegant anime long hair with bangs & curls
      const hairTopGeo = new THREE.SphereGeometry(0.42, 32, 24);
      hairTopGeo.scale(1.02, 1.05, 1.05);
      const hairTop = new THREE.Mesh(hairTopGeo, hairMat);
      hairTop.position.set(0, 0.06, -0.04);
      headGroup.add(hairTop);

      // Bangs
      const bangGeo = new THREE.CylinderGeometry(0.06, 0.01, 0.28, 16);
      for (let b = -2; b <= 2; b++) {
        const bang = new THREE.Mesh(bangGeo, hairMat);
        bang.position.set(b * 0.07, 0.22, 0.32);
        bang.rotation.z = -b * 0.1;
        bang.rotation.x = 0.4;
        headGroup.add(bang);
      }

      // Side curls
      const sideCurlGeo = new THREE.CapsuleGeometry(0.07, 0.55, 12, 16);
      const leftCurl = new THREE.Mesh(sideCurlGeo, hairMat);
      leftCurl.position.set(-0.35, -0.15, 0.05);
      leftCurl.rotation.z = 0.15;
      const rightCurl = new THREE.Mesh(sideCurlGeo, hairMat);
      rightCurl.position.set(0.35, -0.15, 0.05);
      rightCurl.rotation.z = -0.15;
      headGroup.add(leftCurl, rightCurl);
    } else {
      // Male styled spiky textured hair
      const hairCapGeo = new THREE.SphereGeometry(0.42, 24, 24);
      const hairCap = new THREE.Mesh(hairCapGeo, hairMat);
      hairCap.position.set(0, 0.08, -0.02);
      headGroup.add(hairCap);

      const spikeGeo = new THREE.ConeGeometry(0.09, 0.22, 16);
      for (let s = 0; s < 7; s++) {
        const spike = new THREE.Mesh(spikeGeo, hairMat);
        spike.position.set((s - 3) * 0.09, 0.38 - Math.abs(s - 3) * 0.03, 0.1 + (s % 2) * 0.06);
        spike.rotation.x = -0.25;
        spike.rotation.z = (s - 3) * -0.15;
        headGroup.add(spike);
      }
    }

    // ----------------- ACCESSORIES -----------------
    if (accItem && accItem.id !== 'acc_none') {
      if (accItem.styleVariant === 'tiara') {
        const tiaraGeo = new THREE.TorusGeometry(0.24, 0.025, 12, 32, Math.PI * 0.8);
        const goldMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          metalness: 0.85,
          roughness: 0.2,
        });
        const tiara = new THREE.Mesh(tiaraGeo, goldMat);
        tiara.position.set(0, 0.38, 0.15);
        tiara.rotation.x = Math.PI / 2.8;

        // Gem spikes
        const gemGeo = new THREE.ConeGeometry(0.035, 0.12, 8);
        const gemMat = new THREE.MeshStandardMaterial({
          color: 0xec4899,
          metalness: 0.9,
          roughness: 0.1,
        });
        for (let g = -2; g <= 2; g++) {
          const gem = new THREE.Mesh(gemGeo, gemMat);
          gem.position.set(g * 0.07, 0.44 + (2 - Math.abs(g)) * 0.03, 0.18);
          gem.rotation.z = -g * 0.15;
          headGroup.add(gem);
        }
        headGroup.add(tiara);
      } else if (accItem.styleVariant === 'cat_ears') {
        const earGeo = new THREE.ConeGeometry(0.1, 0.2, 16);
        const earMat = new THREE.MeshStandardMaterial({ color: 0xff99c8, roughness: 0.4 });
        const earInnerMat = new THREE.MeshStandardMaterial({ color: 0xffffff });

        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.25, 0.45, 0.05);
        leftEar.rotation.z = 0.35;
        leftEar.rotation.x = -0.1;

        const rightEar = new THREE.Mesh(earGeo, earMat);
        rightEar.position.set(0.25, 0.45, 0.05);
        rightEar.rotation.z = -0.35;
        rightEar.rotation.x = -0.1;

        headGroup.add(leftEar, rightEar);
      } else if (accItem.styleVariant === 'sunglasses') {
        const frameGeo = new THREE.BoxGeometry(0.65, 0.14, 0.04);
        const frameMat = new THREE.MeshStandardMaterial({
          color: 0xf43f5e,
          metalness: 0.5,
          roughness: 0.2,
        });
        const shades = new THREE.Mesh(frameGeo, frameMat);
        shades.position.set(0, 0.06, 0.36);

        const lensGeo = new THREE.BoxGeometry(0.24, 0.11, 0.05);
        const lensMat = new THREE.MeshStandardMaterial({
          color: 0x1e1b4b,
          roughness: 0.1,
          metalness: 0.8,
        });
        const leftLens = new THREE.Mesh(lensGeo, lensMat);
        leftLens.position.set(-0.15, 0.06, 0.365);
        const rightLens = new THREE.Mesh(lensGeo, lensMat);
        rightLens.position.set(0.15, 0.06, 0.365);

        headGroup.add(shades, leftLens, rightLens);
      } else if (accItem.styleVariant === 'angel_halo') {
        const haloGeo = new THREE.TorusGeometry(0.26, 0.025, 16, 32);
        const haloMat = new THREE.MeshStandardMaterial({
          color: 0xfef08a,
          emissive: 0xfef08a,
          emissiveIntensity: 0.7,
        });
        const halo = new THREE.Mesh(haloGeo, haloMat);
        halo.position.set(0, 0.65, -0.05);
        halo.rotation.x = Math.PI / 2.2;
        headGroup.add(halo);
      }
    }

    charGroup.add(headGroup);

    // ----------------- 2. TORSO & CLOTHING -----------------
    const torsoGroup = new THREE.Group();
    torsoGroup.position.set(0, 0.95, 0);

    // Torso body
    const torsoGeo = new THREE.CylinderGeometry(0.24, 0.2, 0.65, 24);
    const torsoMesh = new THREE.Mesh(torsoGeo, clothesMat);
    torsoMesh.castShadow = true;
    torsoGroup.add(torsoMesh);

    // Outfit styling variations
    if (clothesItem?.styleVariant === 'silk_gown' || clothesItem?.styleVariant === 'royal_velvet' || clothesItem?.styleVariant === 'summer_sundress') {
      // Beautiful flowing skirt
      const skirtGeo = new THREE.ConeGeometry(0.55, 0.75, 32, 1, true);
      const skirt = new THREE.Mesh(skirtGeo, clothesMat);
      skirt.position.set(0, -0.45, 0);
      skirt.castShadow = true;
      torsoGroup.add(skirt);

      // Gold belt / waistband
      const beltGeo = new THREE.TorusGeometry(0.21, 0.02, 16, 32);
      const belt = new THREE.Mesh(beltGeo, clothesSecMat);
      belt.position.set(0, -0.1, 0);
      belt.rotation.x = Math.PI / 2;
      torsoGroup.add(belt);
    } else if (clothesItem?.styleVariant === 'denim_jacket' || clothesItem?.styleVariant === 'velvet_tuxedo') {
      // Jacket lapels & inner shirt
      const innerGeo = new THREE.PlaneGeometry(0.16, 0.35);
      const inner = new THREE.Mesh(innerGeo, clothesSecMat);
      inner.position.set(0, 0.08, 0.22);
      torsoGroup.add(inner);
    } else if (clothesItem?.styleVariant === 'cozy_hoodie') {
      // Pouch pocket
      const pouchGeo = new THREE.BoxGeometry(0.25, 0.16, 0.08);
      const pouch = new THREE.Mesh(pouchGeo, clothesSecMat);
      pouch.position.set(0, -0.12, 0.18);
      torsoGroup.add(pouch);
    }

    charGroup.add(torsoGroup);

    // ----------------- 3. ARMS & HANDS -----------------
    const armGeo = new THREE.CapsuleGeometry(0.065, 0.45, 12, 16);

    // Left Arm
    const leftArmGroup = new THREE.Group();
    leftArmGroup.position.set(-0.32, 1.15, 0);
    const leftArmMesh = new THREE.Mesh(armGeo, clothesMat);
    leftArmMesh.position.set(0, -0.22, 0);
    leftArmMesh.castShadow = true;

    const leftHandGeo = new THREE.SphereGeometry(0.065, 16, 16);
    const leftHand = new THREE.Mesh(leftHandGeo, skinMat);
    leftHand.position.set(0, -0.48, 0);
    leftArmGroup.add(leftArmMesh, leftHand);
    charGroup.add(leftArmGroup);
    leftArmRef.current = leftArmGroup;

    // Right Arm
    const rightArmGroup = new THREE.Group();
    rightArmGroup.position.set(0.32, 1.15, 0);
    const rightArmMesh = new THREE.Mesh(armGeo, clothesMat);
    rightArmMesh.position.set(0, -0.22, 0);
    rightArmMesh.castShadow = true;

    const rightHand = new THREE.Mesh(leftHandGeo, skinMat);
    rightHand.position.set(0, -0.48, 0);
    rightArmGroup.add(rightArmMesh, rightHand);
    charGroup.add(rightArmGroup);
    rightArmRef.current = rightArmGroup;

    // ----------------- 4. LEGS & SHOES / HEELS -----------------
    const legGeo = new THREE.CapsuleGeometry(0.08, 0.55, 12, 16);
    const legMat = new THREE.MeshStandardMaterial({
      color: charGender === 'female' && clothesItem?.category === 'clothes' && clothesItem.styleVariant.includes('dress') ? skinColor : 0x1e293b,
      roughness: 0.6,
    });

    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.14, 0.35, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.14, 0.35, 0);
    rightLeg.castShadow = true;
    charGroup.add(leftLeg, rightLeg);

    // Shoe / Heel Rendering
    const shoeColorHex = shoeItem ? parseInt(shoeItem.color.replace('#', '0x')) : 0xffffff;
    const shoeMat = new THREE.MeshStandardMaterial({
      color: shoeColorHex,
      roughness: 0.3,
      metalness: shoeItem?.category === 'heels' ? 0.6 : 0.1,
    });

    if (shoeItem?.category === 'heels') {
      // High Heels: elevated foot + slender heel spike
      const footGeo = new THREE.BoxGeometry(0.11, 0.08, 0.18);
      const heelSpikeGeo = new THREE.CylinderGeometry(0.015, 0.01, 0.14, 12);

      // Left Heel
      const lFoot = new THREE.Mesh(footGeo, shoeMat);
      lFoot.position.set(-0.14, 0.05, 0.03);
      lFoot.rotation.x = 0.25;
      const lSpike = new THREE.Mesh(heelSpikeGeo, shoeMat);
      lSpike.position.set(-0.14, 0.02, -0.04);
      charGroup.add(lFoot, lSpike);

      // Right Heel
      const rFoot = new THREE.Mesh(footGeo, shoeMat);
      rFoot.position.set(0.14, 0.05, 0.03);
      rFoot.rotation.x = 0.25;
      const rSpike = new THREE.Mesh(heelSpikeGeo, shoeMat);
      rSpike.position.set(0.14, 0.02, -0.04);
      charGroup.add(rFoot, rSpike);
    } else {
      // Sneakers / Shoes
      const shoeGeo = new THREE.BoxGeometry(0.12, 0.09, 0.22);
      const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
      lShoe.position.set(-0.14, 0.02, 0.04);
      const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
      rShoe.position.set(0.14, 0.02, 0.04);
      charGroup.add(lShoe, rShoe);
    }

    scene.add(charGroup);
  };

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative cursor-grab active:cursor-grabbing select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Drag to rotate character • Click head to pet • Click body to tickle • Click shoes to spin"
    />
  );
};
