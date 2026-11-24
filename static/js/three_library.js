/**
 * ============================================================================
 * BIBLIOLEARN — IMMERSIVE 3D UNIVERSITY LIBRARY EXPERIENCE
 * Université ESMA Marrakech • Flagship Architecture & Virtual Stacks
 * 
 * Features:
 * - High-performance WebGL 3D Academic Reading & Stacks Hall using Three.js.
 * - Dynamic live integration with Django database (/api/library-3d/).
 * - Realistic multi-tier bookshelves categorized by academic disciplines.
 * - Individual physical books with dynamic spine canvas textures & covers.
 * - Organic shelf layouts: vertical, leaning, and horizontal stacked monographs.
 * - Architectural lighting: Moroccan arched windows, volumetric light shafts,
 *   hanging brass lanterns, study table banker lamps, soft shadows.
 * - BIBI digital librarian character integration and interactive choreography.
 * - Raycaster hover & click selection, camera gliding, category navigation.
 * - Built-in procedural Web Audio API library soundscape (zero external files).
 * ============================================================================
 */

(function () {
    'use strict';

    // Global application namespace
    window.BiblioLearn3D = {
        scene: null,
        camera: null,
        renderer: null,
        controls: null,
        bibi: null,
        booksData: [],
        categories: [],
        shelves: [],
        interactiveBooks: [],
        hoveredBook: null,
        selectedBook: null,
        raycaster: new THREE.Raycaster(),
        mouse: new THREE.Vector2(-999, -999),
        clock: new THREE.Clock(),
        audioEngine: null,
        isAudioPlaying: false,
        ambientParticles: null,

        // Camera presets
        cameraPresets: {
            overview: { pos: new THREE.Vector3(0, 7.5, 16), target: new THREE.Vector3(0, 2.0, 0) },
            desk: { pos: new THREE.Vector3(0, 2.6, 6.8), target: new THREE.Vector3(0, 1.3, 3.5) },
            cs: { pos: new THREE.Vector3(-8.5, 3.2, 4.5), target: new THREE.Vector3(-10.5, 2.4, 0) },
            ai: { pos: new THREE.Vector3(-8.5, 3.2, -6.5), target: new THREE.Vector3(-10.5, 2.4, -9.5) },
            design: { pos: new THREE.Vector3(8.5, 3.2, 4.5), target: new THREE.Vector3(10.5, 2.4, 0) },
            mgmt: { pos: new THREE.Vector3(8.5, 3.2, -6.5), target: new THREE.Vector3(10.5, 2.4, -9.5) },
        },

        init: function () {
            const container = document.getElementById('webgl-container');
            if (!container) return;

            // Check WebGL availability
            if (!this.isWebGLAvailable()) {
                const fallback = document.getElementById('webgl-fallback');
                if (fallback) fallback.classList.remove('d-none');
                return;
            }

            this.setupRenderer(container);
            this.setupScene();
            this.setupCamera(container);
            this.setupLighting();
            this.buildArchitecture();
            this.setupBibiCharacter();
            this.setupEventListeners(container);
            this.setupAudio();

            // Load live Django catalog
            this.fetchDjangoCatalog();

            // Start animation loop
            this.animate();

            // Hide loading overlay once scene is initialized
            setTimeout(() => {
                const loader = document.getElementById('scene-loader');
                if (loader) {
                    loader.style.opacity = '0';
                    setTimeout(() => loader.remove(), 600);
                }
            }, 800);
        },

        isWebGLAvailable: function () {
            try {
                const canvas = document.createElement('canvas');
                return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
            } catch (e) {
                return false;
            }
        },

        setupRenderer: function (container) {
            this.renderer = new THREE.WebGLRenderer({
                antialias: true,
                powerPreference: "high-performance",
                alpha: false
            });
            this.renderer.setSize(container.clientWidth, container.clientHeight);
            this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
            this.renderer.toneMappingExposure = 1.05;
            this.renderer.outputEncoding = THREE.sRGBEncoding;
            container.appendChild(this.renderer.domElement);
        },

        setupScene: function () {
            this.scene = new THREE.Scene();
            this.scene.background = new THREE.Color(0x0c1017); // Midnight Ink
            this.scene.fog = new THREE.FogExp2(0x0c1017, 0.016);
        },

        setupCamera: function (container) {
            this.camera = new THREE.PerspectiveCamera(50, container.clientWidth, container.clientHeight, 0.1, 120);
            this.camera.position.copy(this.cameraPresets.overview.pos);

            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxPolarAngle = Math.PI / 2 - 0.03; // Don't clip through floor
            this.controls.minDistance = 2.0;
            this.controls.maxDistance = 32.0;
            this.controls.target.copy(this.cameraPresets.overview.target);
            this.controls.update();
        },

        setupLighting: function () {
            // 1. Soft Ambient Room Tint (Midnight Ink & Warm Slate)
            const ambient = new THREE.AmbientLight(0x283347, 0.75);
            this.scene.add(ambient);

            // 2. Main Warm Architectural Sunlight / Skylight through arched windows
            const sunLight = new THREE.DirectionalLight(0xfffaed, 1.4);
            sunLight.position.set(0, 14, -20);
            sunLight.target.position.set(0, 0, 0);
            sunLight.castShadow = true;
            sunLight.shadow.mapSize.width = 2048;
            sunLight.shadow.mapSize.height = 2048;
            sunLight.shadow.camera.near = 5;
            sunLight.shadow.camera.far = 45;
            sunLight.shadow.camera.left = -20;
            sunLight.shadow.camera.right = 20;
            sunLight.shadow.camera.top = 18;
            sunLight.shadow.camera.bottom = -5;
            sunLight.shadow.bias = -0.0004;
            this.scene.add(sunLight);
            this.scene.add(sunLight.target);

            // 3. Hanging Moroccan Bronze Lanterns (Warm Amber 2700K Glow)
            const lanternPositions = [
                { x: -5, y: 5.5, z: 2 },
                { x: 5, y: 5.5, z: 2 },
                { x: -5, y: 5.5, z: -8 },
                { x: 5, y: 5.5, z: -8 },
            ];

            const lanternMat = new THREE.MeshStandardMaterial({
                color: 0xB78B55,
                metalness: 0.85,
                roughness: 0.3
            });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xffddaa });

            lanternPositions.forEach((pos, idx) => {
                // Point light
                const light = new THREE.PointLight(0xffb774, 1.1, 14, 1.6);
                light.position.set(pos.x, pos.y, pos.z);
                this.scene.add(light);

                // Lantern hanging chain + body
                const chain = new THREE.Mesh(
                    new THREE.CylinderGeometry(0.015, 0.015, 3.5, 8),
                    lanternMat
                );
                chain.position.set(pos.x, pos.y + 1.75, pos.z);
                this.scene.add(chain);

                const body = new THREE.Mesh(
                    new THREE.OctahedronGeometry(0.35, 1),
                    lanternMat
                );
                body.position.set(pos.x, pos.y, pos.z);
                this.scene.add(body);

                // Internal luminous bulb
                const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.12, 12, 12), glowMat);
                bulb.position.set(pos.x, pos.y, pos.z);
                this.scene.add(bulb);
            });

            // 4. Desk Reading Lamp (Emerald Banker Lamp on Circulation Desk)
            const deskLight = new THREE.PointLight(0x78e08f, 1.3, 5, 2.0);
            deskLight.position.set(0.6, 1.8, 3.2);
            this.scene.add(deskLight);
        },

        buildArchitecture: function () {
            // Materials
            const floorMat = new THREE.MeshStandardMaterial({
                color: 0x181410, // Dark polished cedar parquet
                roughness: 0.35,
                metalness: 0.15
            });

            const wallMat = new THREE.MeshStandardMaterial({
                color: 0x222834, // Warm sandstone slate
                roughness: 0.85,
                metalness: 0.05
            });

            const woodTrimMat = new THREE.MeshStandardMaterial({
                color: 0x2b1d14, // Dark Moroccan cedar wood
                roughness: 0.6,
                metalness: 0.1
            });

            const bronzeTrimMat = new THREE.MeshStandardMaterial({
                color: 0xB78B55, // Muted Bronze
                roughness: 0.35,
                metalness: 0.8
            });

            // 1. Grand Parquet Floor (32m x 42m)
            const floorGeo = new THREE.PlaneGeometry(32, 42);
            const floor = new THREE.Mesh(floorGeo, floorMat);
            floor.rotation.x = -Math.PI / 2;
            floor.receiveShadow = true;
            this.scene.add(floor);

            // Floor Brass Inlay Grid Lines (Zellige geometric boundary accents)
            const gridHelper = new THREE.GridHelper(30, 15, 0xB78B55, 0x2a3648);
            gridHelper.position.y = 0.005;
            this.scene.add(gridHelper);

            // 2. Ceiling with Timber Coffers (y = 8.5m)
            const ceilingGeo = new THREE.PlaneGeometry(32, 42);
            const ceiling = new THREE.Mesh(ceilingGeo, woodTrimMat);
            ceiling.position.y = 8.5;
            ceiling.rotation.x = Math.PI / 2;
            this.scene.add(ceiling);

            // Ceiling Beams (Cross timber grid)
            for (let x = -12; x <= 12; x += 6) {
                const beam = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 42), woodTrimMat);
                beam.position.set(x, 8.25, 0);
                this.scene.add(beam);
            }
            for (let z = -18; z <= 18; z += 6) {
                const crossBeam = new THREE.Mesh(new THREE.BoxGeometry(32, 0.45, 0.4), woodTrimMat);
                crossBeam.position.set(0, 8.28, z);
                this.scene.add(crossBeam);
            }

            // 3. Walls (Back, Left, Right)
            // Back Wall with Grand Moroccan Arched Windows (z = -20)
            const backWall = new THREE.Mesh(new THREE.BoxGeometry(32, 8.5, 0.5), wallMat);
            backWall.position.set(0, 4.25, -20.25);
            backWall.receiveShadow = true;
            this.scene.add(backWall);

            // 3 Grand Arched Window Embrasures
            for (let i = -1; i <= 1; i++) {
                const winX = i * 8.5;
                // Arch frame
                const frame = new THREE.Mesh(
                    new THREE.TorusGeometry(2.0, 0.15, 12, 32, Math.PI),
                    bronzeTrimMat
                );
                frame.position.set(winX, 6.0, -20.0);
                this.scene.add(frame);

                // Window pane with sky light simulation
                const pane = new THREE.Mesh(
                    new THREE.PlaneGeometry(3.8, 5.0),
                    new THREE.MeshBasicMaterial({ color: 0x4a6fa5, transparent: true, opacity: 0.35 })
                );
                pane.position.set(winX, 4.2, -20.0);
                this.scene.add(pane);

                // Volumetric Light Beam Shaft
                const beamGeo = new THREE.ConeGeometry(3.5, 18, 16, 1, true);
                const beamMat = new THREE.MeshBasicMaterial({
                    color: 0xfffae8,
                    transparent: true,
                    opacity: 0.045,
                    side: THREE.DoubleSide,
                    depthWrite: false,
                    blending: THREE.AdditiveBlending
                });
                const beam = new THREE.Mesh(beamGeo, beamMat);
                beam.position.set(winX, 4.5, -11.0);
                beam.rotation.x = Math.PI / 3.2;
                this.scene.add(beam);
            }

            // Left & Right Flank Walls
            const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.5, 42), wallMat);
            leftWall.position.set(-16.25, 4.25, 0);
            leftWall.receiveShadow = true;
            this.scene.add(leftWall);

            const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 8.5, 42), wallMat);
            rightWall.position.set(16.25, 4.25, 0);
            rightWall.receiveShadow = true;
            this.scene.add(rightWall);

            // Moroccan Architectural Pilasters (Columns along walls)
            for (let z = -16; z <= 16; z += 8) {
                const colL = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 0.8), woodTrimMat);
                colL.position.set(-15.8, 4.25, z);
                colL.castShadow = true;
                this.scene.add(colL);

                const colR = new THREE.Mesh(new THREE.BoxGeometry(0.8, 8.5, 0.8), woodTrimMat);
                colR.position.set(15.8, 4.25, z);
                colR.castShadow = true;
                this.scene.add(colR);
            }

            // 4. Central Consultation / Circulation Desk (BIBI's Station)
            const deskGroup = new THREE.Group();
            deskGroup.position.set(0, 0, 3.2);

            // Curved mahogany desk counter
            const deskBase = new THREE.Mesh(
                new THREE.CylinderGeometry(2.4, 2.4, 1.05, 32, 1, false, 0, Math.PI),
                woodTrimMat
            );
            deskBase.position.y = 0.525;
            deskBase.castShadow = true;
            deskBase.receiveShadow = true;
            deskGroup.add(deskBase);

            // Bronze counter top rim
            const counterTop = new THREE.Mesh(
                new THREE.CylinderGeometry(2.55, 2.55, 0.08, 32, 1, false, 0, Math.PI),
                bronzeTrimMat
            );
            counterTop.position.y = 1.08;
            counterTop.castShadow = true;
            deskGroup.add(counterTop);

            // Retro Terminal / Computer Monitor on desk
            const monitorStand = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), bronzeTrimMat);
            monitorStand.position.set(0.6, 1.25, 0.2);
            deskGroup.add(monitorStand);

            const monitorScreen = new THREE.Mesh(
                new THREE.BoxGeometry(0.55, 0.38, 0.04),
                new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.2 })
            );
            monitorScreen.position.set(0.6, 1.48, 0.2);
            monitorScreen.rotation.y = -0.3;
            deskGroup.add(monitorScreen);

            // Green Banker Lamp on Desk
            const lampBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.04, 12), bronzeTrimMat);
            lampBase.position.set(0.6, 1.14, -0.6);
            deskGroup.add(lampBase);

            const lampShade = new THREE.Mesh(
                new THREE.CylinderGeometry(0.09, 0.09, 0.22, 16, 1, false, 0, Math.PI),
                new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.3 })
            );
            lampShade.rotation.z = Math.PI / 2;
            lampShade.position.set(0.6, 1.38, -0.6);
            deskGroup.add(lampShade);

            // Brass Service Call Bell
            const bell = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), bronzeTrimMat);
            bell.position.set(-0.5, 1.14, 0.5);
            deskGroup.add(bell);

            this.scene.add(deskGroup);

            // 5. Two Academic Study Tables with Banker Lamps
            this.buildStudyTable(-4.5, 0, -5);
            this.buildStudyTable(4.5, 0, -5);

            // 6. Ambient Floating Dust Mote Particles
            this.setupDustParticles();
        },

        buildStudyTable: function (x, y, z) {
            const tableGroup = new THREE.Group();
            tableGroup.position.set(x, y, z);

            const oakMat = new THREE.MeshStandardMaterial({ color: 0x241810, roughness: 0.5 });
            const bronzeMat = new THREE.MeshStandardMaterial({ color: 0xB78B55, roughness: 0.35, metalness: 0.8 });

            // Table top (4.2m long x 1.4m wide x 0.1m thick)
            const top = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 4.2), oakMat);
            top.position.y = 0.85;
            top.castShadow = true;
            top.receiveShadow = true;
            tableGroup.add(top);

            // 4 Legs
            const legPositions = [
                { lx: 0.6, lz: 1.9 },
                { lx: -0.6, lz: 1.9 },
                { lx: 0.6, lz: -1.9 },
                { lx: -0.6, lz: -1.9 }
            ];
            legPositions.forEach(lp => {
                const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.85, 12), bronzeMat);
                leg.position.set(lp.lx, 0.425, lp.lz);
                leg.castShadow = true;
                tableGroup.add(leg);
            });

            // Center Brass Study Lamp on table
            const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.35, 12), bronzeMat);
            lamp.position.set(0, 1.05, 0);
            tableGroup.add(lamp);

            const lampShade = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, 0.4, 16, 1, false, 0, Math.PI),
                new THREE.MeshStandardMaterial({ color: 0x1b5e20, roughness: 0.25 })
            );
            lampShade.rotation.z = Math.PI / 2;
            lampShade.position.set(0, 1.25, 0);
            tableGroup.add(lampShade);

            // Point light for study table
            const tableLight = new THREE.PointLight(0x78e08f, 0.9, 4.5, 2.0);
            tableLight.position.set(x, 1.35, z);
            this.scene.add(tableLight);

            this.scene.add(tableGroup);
        },

        setupDustParticles: function () {
            const particleCount = 350;
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount * 3; i += 3) {
                positions[i] = (Math.random() - 0.5) * 26;
                positions[i + 1] = Math.random() * 7.5 + 0.5;
                positions[i + 2] = (Math.random() - 0.5) * 34;
            }

            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const mat = new THREE.PointsMaterial({
                color: 0xfff0d0,
                size: 0.05,
                transparent: true,
                opacity: 0.45,
                blending: THREE.AdditiveBlending
            });

            this.ambientParticles = new THREE.Points(geo, mat);
            this.scene.add(this.ambientParticles);
        },

        setupBibiCharacter: function () {
            // Instantiate procedural 3D librarian character BIBI at consultation desk
            this.bibi = new BibiCharacter(this.scene, {
                initialPosition: new THREE.Vector3(0, 0, 4.2),
                scale: 1.05,
                primaryColor: 0x111827,
                accentColor: 0xB78B55,
                shirtColor: 0xF5F2EB,
                skinColor: 0xDEB887,
                tieColor: 0x315C9B
            });

            // Set speech callback to update HUD speech bubble
            this.bibi.onSpeech = (speechText) => {
                const bubble = document.getElementById('bibi-speech-text');
                const capsule = document.getElementById('bibi-speech-capsule');
                if (bubble && capsule) {
                    bubble.textContent = speechText;
                    capsule.classList.remove('d-none');
                    capsule.classList.add('speech-pulse');
                    setTimeout(() => capsule.classList.remove('speech-pulse'), 1200);
                }
            };

            // Initial welcoming statement
            setTimeout(() => {
                this.bibi.say('"Welcome to the ESMA Marrakech Central Holdings. I am BIBI, your digital archivist. Click any monograph on the shelves to begin."');
            }, 1200);
        },

        /**
         * Fetches live books and categories from the Django backend endpoint.
         */
        fetchDjangoCatalog: function () {
            fetch('/api/library-3d/')
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.books) {
                        this.booksData = data.books;
                        this.categories = data.categories;
                        this.populateShelves(data.categories, data.books);
                        this.updateHUDStats(data.total, data.available_count);
                        this.renderCategoryPills(data.categories);
                    }
                })
                .catch(err => {
                    console.error("Error loading Django 3D catalog:", err);
                });
        },

        /**
         * Constructs physical 3D bookshelves and positions real Django books onto them.
         */
        populateShelves: function (categories, books) {
            // Clear any existing shelves
            this.shelves.forEach(s => this.scene.remove(s.group));
            this.shelves = [];
            this.interactiveBooks = [];

            // Shelf architectural layout slots:
            // 4 main wall alcoves / aisles
            const shelfConfigurations = [
                {
                    catName: "Informatique & Web",
                    pos: new THREE.Vector3(-12.5, 0, 0),
                    rotY: Math.PI / 2,
                    normal: new THREE.Vector3(1, 0, 0)
                },
                {
                    catName: "Intelligence Artificielle",
                    pos: new THREE.Vector3(-12.5, 0, -9.5),
                    rotY: Math.PI / 2,
                    normal: new THREE.Vector3(1, 0, 0)
                },
                {
                    catName: "Design & Multimédia",
                    pos: new THREE.Vector3(12.5, 0, 0),
                    rotY: -Math.PI / 2,
                    normal: new THREE.Vector3(-1, 0, 0)
                },
                {
                    catName: "Management & Gestion",
                    pos: new THREE.Vector3(12.5, 0, -9.5),
                    rotY: -Math.PI / 2,
                    normal: new THREE.Vector3(-1, 0, 0)
                },
                {
                    catName: "Marketing & Communication",
                    pos: new THREE.Vector3(0, 0, -18.5),
                    rotY: 0,
                    normal: new THREE.Vector3(0, 0, 1)
                }
            ];

            // Build a bookshelf for each configuration
            shelfConfigurations.forEach(config => {
                const shelf = this.buildBookshelf(config.catName, config.pos, config.rotY, config.normal);
                this.shelves.push(shelf);

                // Filter books belonging to this category
                const catBooks = books.filter(b => b.categorie === config.catName);

                // Place books onto the shelf's tiers
                this.placeBooksOnShelf(shelf, catBooks);
            });
        },

        /**
         * Constructs a tall 4-tier dark cedar architectural bookshelf.
         */
        buildBookshelf: function (categoryTitle, position, rotationY, normalVec) {
            const group = new THREE.Group();
            group.position.copy(position);
            group.rotation.y = rotationY;

            const cedarMat = new THREE.MeshStandardMaterial({
                color: 0x221710, // Dark cedar wood
                roughness: 0.6,
                metalness: 0.1
            });

            const bronzeMat = new THREE.MeshStandardMaterial({
                color: 0xB78B55,
                roughness: 0.35,
                metalness: 0.85
            });

            const shelfWidth = 5.2;
            const shelfHeight = 4.2;
            const shelfDepth = 0.55;

            // Back panel
            const back = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth, shelfHeight, 0.05), cedarMat);
            back.position.set(0, shelfHeight / 2, -shelfDepth / 2 + 0.025);
            back.receiveShadow = true;
            group.add(back);

            // Left & Right side vertical uprights
            const leftUpright = new THREE.Mesh(new THREE.BoxGeometry(0.12, shelfHeight, shelfDepth), cedarMat);
            leftUpright.position.set(-shelfWidth / 2 + 0.06, shelfHeight / 2, 0);
            leftUpright.castShadow = true;
            group.add(leftUpright);

            const rightUpright = new THREE.Mesh(new THREE.BoxGeometry(0.12, shelfHeight, shelfDepth), cedarMat);
            rightUpright.position.set(shelfWidth / 2 - 0.06, shelfHeight / 2, 0);
            rightUpright.castShadow = true;
            group.add(rightUpright);

            // Central vertical divider
            const centerDivider = new THREE.Mesh(new THREE.BoxGeometry(0.08, shelfHeight, shelfDepth), cedarMat);
            centerDivider.position.set(0, shelfHeight / 2, 0);
            centerDivider.castShadow = true;
            group.add(centerDivider);

            // 4 Horizontal Tiers
            const tierHeights = [0.15, 1.15, 2.15, 3.15, 4.15];
            const tiers = [];
            tierHeights.forEach(th => {
                const plank = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth - 0.1, 0.06, shelfDepth), cedarMat);
                plank.position.set(0, th, 0);
                plank.castShadow = true;
                plank.receiveShadow = true;
                group.add(plank);

                // Bronze front lip trim
                const trim = new THREE.Mesh(new THREE.BoxGeometry(shelfWidth - 0.1, 0.03, 0.02), bronzeMat);
                trim.position.set(0, th, shelfDepth / 2);
                group.add(trim);

                tiers.push(th + 0.03); // Book base level
            });

            // Glowing Category Header Arch atop shelf
            const headerPlacard = this.createCategoryHeaderTexture(categoryTitle);
            const headerMesh = new THREE.Mesh(
                new THREE.PlaneGeometry(3.6, 0.55),
                new THREE.MeshBasicMaterial({ map: headerPlacard, transparent: true })
            );
            headerMesh.position.set(0, shelfHeight + 0.35, 0.1);
            group.add(headerMesh);

            // Arch crown frame
            const crownArch = new THREE.Mesh(
                new THREE.TorusGeometry(1.8, 0.06, 8, 24, Math.PI),
                bronzeMat
            );
            crownArch.position.set(0, shelfHeight + 0.15, 0);
            group.add(crownArch);

            this.scene.add(group);

            return {
                category: categoryTitle,
                group: group,
                tiers: tiers,
                shelfWidth: shelfWidth,
                shelfDepth: shelfDepth,
                worldPos: position,
                normal: normalVec
            };
        },

        /**
         * Renders an elegant gold-embossed category placard canvas texture.
         */
        createCategoryHeaderTexture: function (text) {
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 160;
            const ctx = canvas.getContext('2d');

            // Dark midnight slate gradient
            const grad = ctx.createLinearGradient(0, 0, 1024, 0);
            grad.addColorStop(0, '#0c1017');
            grad.addColorStop(0.5, '#1e293b');
            grad.addColorStop(1, '#0c1017');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, 1024, 160);

            // Bronze double border
            ctx.strokeStyle = '#B78B55';
            ctx.lineWidth = 4;
            ctx.strokeRect(10, 10, 1004, 140);
            ctx.lineWidth = 1.5;
            ctx.strokeRect(16, 16, 992, 128);

            // Category Title in Cormorant Garamond style
            ctx.fillStyle = '#EAE7DF';
            ctx.font = 'bold 44px "Cormorant Garamond", Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text.toUpperCase(), 512, 70);

            // Archival Subtitle in JetBrains Mono style
            ctx.fillStyle = '#B78B55';
            ctx.font = '600 20px "JetBrains Mono", monospace';
            ctx.fillText('ESMA CENTRAL HOLDINGS • ARCHIVE SECTION', 512, 116);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        },

        /**
         * Distributes real books onto the shelf's physical tiers with organic variation.
         */
        placeBooksOnShelf: function (shelf, books) {
            if (!books || books.length === 0) return;

            // Use the two most accessible tiers (tier 1: y=1.18, tier 2: y=2.18)
            const activeTiers = [shelf.tiers[1], shelf.tiers[2]];

            // Layout width per section (left bay: x=-2.4 to -0.2, right bay: x=0.2 to 2.4)
            let tierIdx = 0;
            let currentX = -2.2;
            const endX = 2.2;

            books.forEach((bookData, idx) => {
                const tierY = activeTiers[tierIdx];

                // Vary physical book dimensions realistically
                const thickness = 0.08 + (idx % 3) * 0.025; // 8cm to 13cm
                const height = 0.44 + (idx % 4) * 0.03;      // 44cm to 53cm
                const depth = 0.32;                          // 32cm deep

                if (currentX + thickness > endX) {
                    // Move to next tier
                    tierIdx = (tierIdx + 1) % activeTiers.length;
                    currentX = -2.2;
                }

                // Create the 3D book mesh
                const bookMesh = this.createBookMesh(bookData, thickness, height, depth);

                // Position within shelf coordinate system
                const bookX = currentX + thickness / 2;
                const bookY = tierY + height / 2;
                const bookZ = 0.05; // Slightly recessed inside shelf

                bookMesh.position.set(bookX, bookY, bookZ);

                // Organic variation: some books are slightly tilted/leaning
                if (idx % 4 === 2) {
                    bookMesh.rotation.z = -0.12; // Leaning gently to the left
                }

                // Store metadata for raycasting & retrieval choreography
                bookMesh.userData = Object.assign({}, bookData, {
                    shelfWorldPos: shelf.worldPos,
                    shelfNormalX: shelf.normal.x,
                    shelfNormalZ: shelf.normal.z,
                    defaultZ: bookZ,
                    category: shelf.category
                });

                shelf.group.add(bookMesh);
                this.interactiveBooks.push(bookMesh);

                // Advance X slot on shelf
                currentX += thickness + 0.04;

                // Add 1-2 decorative vintage filler books between main titles
                const fillerCount = 1 + (idx % 2);
                for (let f = 0; f < fillerCount; f++) {
                    const fThickness = 0.065 + Math.random() * 0.04;
                    const fHeight = 0.40 + Math.random() * 0.10;
                    const fDepth = 0.30;
                    const filler = this.createFillerBook(fThickness, fHeight, fDepth);
                    filler.position.set(currentX + fThickness / 2, tierY + fHeight / 2, 0.05);
                    shelf.group.add(filler);
                    currentX += fThickness + 0.015;
                }
            });
        },

        /**
         * Builds an individual 3D monograph with front cover, gold-embossed spine, and pages.
         */
        createBookMesh: function (bookData, width, height, depth) {
            const group = new THREE.Group();

            // 1. Book Pages Block (Ivory paper)
            const pagesMat = new THREE.MeshStandardMaterial({
                color: 0xEAE7DF,
                roughness: 0.9,
                metalness: 0.0
            });
            const pagesGeo = new THREE.BoxGeometry(width - 0.015, height - 0.02, depth - 0.02);
            const pages = new THREE.Mesh(pagesGeo, pagesMat);
            pages.position.set(0, 0, -0.01);
            group.add(pages);

            // 2. Leather Cover Material with book's custom color
            const coverColor = bookData.couleur && bookData.couleur.startsWith('#')
                ? parseInt(bookData.couleur.replace('#', '0x'), 16)
                : 0x315C9B; // Academic Blue default

            const leatherMat = new THREE.MeshStandardMaterial({
                color: coverColor,
                roughness: 0.45,
                metalness: 0.15
            });

            // Hardcover boards (Front and Back)
            const boardGeo = new THREE.BoxGeometry(width, height, 0.012);
            const frontBoard = new THREE.Mesh(boardGeo, leatherMat);
            frontBoard.position.set(0, 0, depth / 2 - 0.006);
            frontBoard.castShadow = true;
            group.add(frontBoard);

            const backBoard = new THREE.Mesh(boardGeo, leatherMat);
            backBoard.position.set(0, 0, -depth / 2 + 0.006);
            group.add(backBoard);

            // 3. Curved Book Spine (Facing outward toward visitor!)
            const spineTexture = this.createSpineCanvasTexture(bookData.titre, bookData.auteur, bookData.isbn, bookData.couleur);
            const spineMat = new THREE.MeshStandardMaterial({
                map: spineTexture,
                roughness: 0.4,
                metalness: 0.2
            });

            const spineGeo = new THREE.PlaneGeometry(width, height);
            const spine = new THREE.Mesh(spineGeo, spineMat);
            spine.position.set(0, 0, depth / 2 + 0.001); // Facing front (+Z in local shelf space)
            group.add(spine);

            // 4. Front Cover Art Texture (if available)
            if (bookData.cover_url) {
                const textureLoader = new THREE.TextureLoader();
                textureLoader.crossOrigin = "anonymous";
                textureLoader.load(bookData.cover_url, (tex) => {
                    tex.encoding = THREE.sRGBEncoding;
                    const coverArtMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4 });
                    const coverArtMesh = new THREE.Mesh(new THREE.PlaneGeometry(depth, height), coverArtMat);
                    coverArtMesh.rotation.y = Math.PI / 2;
                    coverArtMesh.position.set(width / 2 + 0.002, 0, 0);
                    group.add(coverArtMesh);
                });
            }

            // Outline highlight mesh (initially invisible)
            const outlineGeo = new THREE.BoxGeometry(width + 0.02, height + 0.02, depth + 0.02);
            const outlineMat = new THREE.MeshBasicMaterial({
                color: 0xB78B55,
                wireframe: true,
                transparent: true,
                opacity: 0
            });
            const outline = new THREE.Mesh(outlineGeo, outlineMat);
            outline.name = "highlight_outline";
            group.add(outline);

            return group;
        },

        /**
         * Renders vertical gold lettering onto the book spine canvas texture.
         */
        createSpineCanvasTexture: function (title, author, isbn, hexColor) {
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');

            // Spine Background Tone
            ctx.fillStyle = hexColor && hexColor.startsWith('#') ? hexColor : '#1C283E';
            ctx.fillRect(0, 0, 128, 512);

            // Gold Embossed Borders at head and tail of spine
            ctx.strokeStyle = '#B78B55';
            ctx.lineWidth = 4;
            ctx.strokeRect(12, 12, 104, 488);

            // Dual Gold Accent Ribs
            ctx.fillStyle = '#B78B55';
            ctx.fillRect(16, 40, 96, 4);
            ctx.fillRect(16, 48, 96, 2);
            ctx.fillRect(16, 460, 96, 2);
            ctx.fillRect(16, 468, 96, 4);

            // Vertical Spine Title Text
            ctx.save();
            ctx.translate(64, 250);
            ctx.rotate(Math.PI / 2); // Rotate text vertically along spine
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // Truncate title if long
            const maxTitleLen = 28;
            const displayTitle = title.length > maxTitleLen ? title.substring(0, maxTitleLen) + '...' : title;
            ctx.fillText(displayTitle, 0, 0);
            ctx.restore();

            // Author on Spine
            ctx.save();
            ctx.translate(64, 410);
            ctx.rotate(Math.PI / 2);
            ctx.fillStyle = '#EAE7DF';
            ctx.font = '500 16px "Cormorant Garamond", Georgia, serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const displayAuthor = author.length > 20 ? author.substring(0, 20) + '...' : author;
            ctx.fillText(displayAuthor, 0, 0);
            ctx.restore();

            // Call Number / ISBN Stamp at base
            ctx.fillStyle = '#B78B55';
            ctx.font = '600 11px "JetBrains Mono", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(isbn ? isbn.substring(0, 13) : 'ESMA-ARCH', 64, 492);

            const texture = new THREE.CanvasTexture(canvas);
            texture.needsUpdate = true;
            return texture;
        },

        /**
         * Creates generic filler monographs to maintain shelf density.
         */
        createFillerBook: function (w, h, d) {
            const fillerColors = [0x162032, 0x241810, 0x1a2e22, 0x2d1b1b, 0x1f2937];
            const col = fillerColors[Math.floor(Math.random() * fillerColors.length)];

            const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 });
            const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
            mesh.castShadow = true;
            return mesh;
        },

        setupEventListeners: function (container) {
            // Window resize
            window.addEventListener('resize', () => {
                this.camera.aspect = container.clientWidth / container.clientHeight;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(container.clientWidth, container.clientHeight);
            });

            // Mouse move for Gaze Tracking & Raycasting
            window.addEventListener('mousemove', (e) => {
                const rect = container.getBoundingClientRect();
                this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
                this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

                // Send normalized mouse coordinates to BIBI gaze tracker
                if (this.bibi) {
                    this.bibi.updateMouseGaze(this.mouse.x, this.mouse.y);
                }

                // Raycast for Book Hover
                this.checkBookHover();
            });

            // Click to select a book
            container.addEventListener('click', (e) => {
                this.handleBookClick();
            });

            // Touch support for mobile devices
            container.addEventListener('touchstart', (e) => {
                if (e.touches.length > 0) {
                    const rect = container.getBoundingClientRect();
                    this.mouse.x = ((e.touches[0].clientX - rect.left) / rect.width) * 2 - 1;
                    this.mouse.y = -((e.touches[0].clientY - rect.top) / rect.height) * 2 + 1;
                    this.handleBookClick();
                }
            }, { passive: true });

            // Hook up UI buttons
            this.bindUIButtons();
        },

        checkBookHover: function () {
            this.raycaster.setFromCamera(this.mouse, this.camera);
            const intersects = this.raycaster.intersectObjects(this.interactiveBooks, true);

            if (intersects.length > 0) {
                // Find top-level book group
                let target = intersects[0].object;
                while (target.parent && !this.interactiveBooks.includes(target)) {
                    target = target.parent;
                }

                if (this.interactiveBooks.includes(target)) {
                    if (this.hoveredBook !== target) {
                        this.unhighlightBook(this.hoveredBook);
                        this.hoveredBook = target;
                        this.highlightBook(target);
                    }
                    document.body.style.cursor = 'pointer';
                    return;
                }
            }

            if (this.hoveredBook) {
                this.unhighlightBook(this.hoveredBook);
                this.hoveredBook = null;
                document.body.style.cursor = 'default';
                this.hideHoverTooltip();
            }
        },

        highlightBook: function (bookGroup) {
            if (!bookGroup || bookGroup === this.selectedBook) return;

            // Slide book slightly forward from shelf (8cm)
            if (typeof TWEEN !== 'undefined') {
                new TWEEN.Tween(bookGroup.position)
                    .to({ z: (bookGroup.userData.defaultZ || 0.05) + 0.12 }, 200)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .start();
            } else {
                bookGroup.position.z = (bookGroup.userData.defaultZ || 0.05) + 0.12;
            }

            // Reveal bronze wireframe highlight
            const outline = bookGroup.getObjectByName("highlight_outline");
            if (outline) outline.material.opacity = 0.85;

            // Show floating 3D HUD tooltip
            this.showHoverTooltip(bookGroup.userData);
        },

        unhighlightBook: function (bookGroup) {
            if (!bookGroup || bookGroup === this.selectedBook) return;

            // Slide back to flush shelf position
            if (typeof TWEEN !== 'undefined') {
                new TWEEN.Tween(bookGroup.position)
                    .to({ z: bookGroup.userData.defaultZ || 0.05 }, 200)
                    .easing(TWEEN.Easing.Cubic.Out)
                    .start();
            } else {
                bookGroup.position.z = bookGroup.userData.defaultZ || 0.05;
            }

            const outline = bookGroup.getObjectByName("highlight_outline");
            if (outline) outline.material.opacity = 0;
        },

        showHoverTooltip: function (data) {
            const tip = document.getElementById('book-hover-callout');
            if (!tip || !data) return;

            tip.querySelector('.callout-title').textContent = data.titre;
            tip.querySelector('.callout-author').textContent = data.auteur;
            tip.querySelector('.callout-cat').textContent = data.categorie;
            tip.querySelector('.callout-status').textContent = data.disponible ? "AVAILABLE IN STACKS" : "ON LOAN";
            tip.querySelector('.callout-status').className = `callout-status ${data.disponible ? 'text-success' : 'text-warning'}`;
            tip.classList.remove('d-none');
        },

        hideHoverTooltip: function () {
            const tip = document.getElementById('book-hover-callout');
            if (tip) tip.classList.add('d-none');
        },

        handleBookClick: function () {
            if (!this.hoveredBook) return;

            const clickedBook = this.hoveredBook;
            this.selectedBook = clickedBook;
            this.hideHoverTooltip();

            // Play gentle book chime sound
            this.playAcousticChime();

            // 1. Trigger BIBI's fetch & present choreography
            if (this.bibi) {
                this.bibi.fetchBookChoreography(clickedBook, (presentedBook) => {
                    // Open the editorial Book Folio Drawer
                    this.openBookFolioDrawer(presentedBook.userData);
                });
            } else {
                this.openBookFolioDrawer(clickedBook.userData);
            }

            // 2. Smoothly frame camera on BIBI & the book
            this.glideCamera(
                new THREE.Vector3(this.bibi.group.position.x, 2.2, this.bibi.group.position.z + 3.2),
                new THREE.Vector3(this.bibi.group.position.x, 1.4, this.bibi.group.position.z),
                1200
            );
        },

        openBookFolioDrawer: function (data) {
            const drawer = document.getElementById('book-folio-drawer');
            if (!drawer || !data) return;

            drawer.querySelector('#folio-title').textContent = data.titre;
            drawer.querySelector('#folio-author').textContent = data.auteur;
            drawer.querySelector('#folio-category').textContent = data.categorie;
            drawer.querySelector('#folio-isbn').textContent = data.isbn || `ESMA-ARCH-${data.id}`;
            drawer.querySelector('#folio-year').textContent = data.annee || 2026;
            drawer.querySelector('#folio-copies').textContent = `${data.exemplaires || 3} Copies`;
            drawer.querySelector('#folio-rating').textContent = `${data.note || 4.8} / 5.0`;
            drawer.querySelector('#folio-desc').textContent = data.description || "Official academic monograph preserved in ESMA central catalog.";

            // Cover image
            const coverImg = drawer.querySelector('#folio-cover');
            if (coverImg) {
                coverImg.src = data.cover_url || "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80";
            }

            // Availability Badge & Buttons
            const availBadge = drawer.querySelector('#folio-availability');
            const borrowBtn = drawer.querySelector('#btn-folio-borrow');
            if (data.disponible) {
                availBadge.className = "badge-archival badge-subtle-sage";
                availBadge.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i> Available in Stacks';
                borrowBtn.disabled = false;
                borrowBtn.innerHTML = '<i class="bi bi-bookmark-check-fill me-1"></i> Request 14-Day Loan';
            } else {
                availBadge.className = "badge-archival badge-subtle-rose";
                availBadge.innerHTML = '<i class="bi bi-clock-history me-1"></i> Currently Checked Out';
                borrowBtn.disabled = true;
                borrowBtn.innerHTML = '<i class="bi bi-x-circle me-1"></i> Unavailable for Loan';
            }

            // Store active book ID on borrow button
            borrowBtn.dataset.bookId = data.id;

            drawer.classList.add('open');
        },

        closeBookFolioDrawer: function () {
            const drawer = document.getElementById('book-folio-drawer');
            if (drawer) drawer.classList.remove('open');

            // If BIBI is holding the book, return it to the shelf!
            if (this.bibi && this.bibi.heldBook) {
                this.bibi.returnBookChoreography(() => {
                    this.selectedBook = null;
                });
            } else {
                this.selectedBook = null;
            }

            // Reset camera to wide overview
            this.glideCamera(this.cameraPresets.overview.pos, this.cameraPresets.overview.target, 1200);
        },

        glideCamera: function (toPos, toTarget, duration = 1000) {
            if (typeof TWEEN === 'undefined') {
                this.camera.position.copy(toPos);
                this.controls.target.copy(toTarget);
                this.controls.update();
                return;
            }

            new TWEEN.Tween(this.camera.position)
                .to(toPos, duration)
                .easing(TWEEN.Easing.Cubic.InOut)
                .start();

            new TWEEN.Tween(this.controls.target)
                .to(toTarget, duration)
                .easing(TWEEN.Easing.Cubic.InOut)
                .onUpdate(() => this.controls.update())
                .start();
        },

        bindUIButtons: function () {
            // Close Drawer button
            const closeBtn = document.getElementById('btn-close-folio');
            if (closeBtn) closeBtn.addEventListener('click', () => this.closeBookFolioDrawer());

            // Return to Shelf button
            const returnBtn = document.getElementById('btn-folio-return');
            if (returnBtn) returnBtn.addEventListener('click', () => this.closeBookFolioDrawer());

            // Borrow Book via AJAX
            const borrowBtn = document.getElementById('btn-folio-borrow');
            if (borrowBtn) {
                borrowBtn.addEventListener('click', () => {
                    const bookId = borrowBtn.dataset.bookId;
                    if (!bookId) return;

                    fetch(`/api/livres/${bookId}/emprunter/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': this.getCSRFToken(),
                            'Content-Type': 'application/json'
                        }
                    })
                    .then(r => r.json())
                    .then(res => {
                        if (res.success) {
                            if (this.bibi) {
                                this.bibi.say(`"Loan confirmed! '${res.titre}' has been signed out under your ESMA archival record."`);
                            }
                            this.showToast("Archival Circulation Confirmed", res.message, "success");
                            this.closeBookFolioDrawer();
                            // Refresh catalog
                            this.fetchDjangoCatalog();
                        } else {
                            this.showToast("Loan Notice", res.message, "warning");
                        }
                    })
                    .catch(err => {
                        this.showToast("System Alert", "Circulation desk offline. Please try again.", "danger");
                    });
                });
            }

            // Camera Viewpoint Rail Buttons
            document.querySelectorAll('[data-viewpoint]').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const vp = e.currentTarget.dataset.viewpoint;
                    if (this.cameraPresets[vp]) {
                        this.glideCamera(this.cameraPresets[vp].pos, this.cameraPresets[vp].target, 1200);
                        // Highlight active button
                        document.querySelectorAll('[data-viewpoint]').forEach(b => b.classList.remove('active'));
                        e.currentTarget.classList.add('active');
                    }
                });
            });

            // 3D HUD Search input
            const searchInput = document.getElementById('hud-search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    const q = e.target.value.toLowerCase().trim();
                    this.filterBooks3D(q);
                });
            }

            // Audio Ambience Toggle
            const audioBtn = document.getElementById('btn-toggle-audio');
            if (audioBtn) {
                audioBtn.addEventListener('click', () => {
                    this.toggleAudio();
                });
            }
        },

        filterBooks3D: function (query) {
            if (!query) {
                this.interactiveBooks.forEach(b => {
                    b.visible = true;
                    const ol = b.getObjectByName("highlight_outline");
                    if (ol) ol.material.opacity = 0;
                });
                return;
            }

            let matchCount = 0;
            this.interactiveBooks.forEach(b => {
                const title = (b.userData.titre || "").toLowerCase();
                const author = (b.userData.auteur || "").toLowerCase();
                const cat = (b.userData.categorie || "").toLowerCase();
                const isbn = (b.userData.isbn || "").toLowerCase();

                const isMatch = title.includes(query) || author.includes(query) || cat.includes(query) || isbn.includes(query);
                b.visible = isMatch;
                const ol = b.getObjectByName("highlight_outline");
                if (ol) ol.material.opacity = isMatch ? 0.9 : 0;

                if (isMatch) matchCount++;
            });

            if (this.bibi && query.length > 2) {
                this.bibi.say(`"Found ${matchCount} monograph${matchCount === 1 ? '' : 's'} matching '${query}' in the stacks."`);
            }
        },

        updateHUDStats: function (total, avail) {
            const statTotal = document.getElementById('hud-total-books');
            const statAvail = document.getElementById('hud-avail-books');
            if (statTotal) statTotal.textContent = total;
            if (statAvail) statAvail.textContent = avail;
        },

        renderCategoryPills: function (categories) {
            const container = document.getElementById('hud-category-pills');
            if (!container) return;

            container.innerHTML = '';
            categories.forEach(cat => {
                const btn = document.createElement('button');
                btn.className = "btn-hud-pill";
                btn.textContent = cat;
                btn.addEventListener('click', () => {
                    // Find shelf matching this category
                    const shelf = this.shelves.find(s => s.category === cat);
                    if (shelf) {
                        const targetPos = new THREE.Vector3(
                            shelf.worldPos.x + shelf.normal.x * 3.5,
                            2.4,
                            shelf.worldPos.z + shelf.normal.z * 3.5
                        );
                        this.glideCamera(targetPos, shelf.worldPos, 1200);
                        if (this.bibi) {
                            this.bibi.say(`"Navigating to the ${cat} academic repository."`);
                        }
                    }
                });
                container.appendChild(btn);
            });
        },

        /**
         * Procedural Web Audio API soundscape (zero external MP3 dependencies).
         */
        setupAudio: function () {
            // Lazy-init on first user gesture to comply with browser autoplay policies
            this.audioCtx = null;
        },

        toggleAudio: function () {
            const btn = document.getElementById('btn-toggle-audio');
            if (!this.audioCtx) {
                try {
                    const AudioContext = window.AudioContext || window.webkitAudioContext;
                    this.audioCtx = new AudioContext();
                    this.startProceduralAmbience();
                    this.isAudioPlaying = true;
                    if (btn) btn.innerHTML = '<i class="bi bi-volume-up-fill me-1 text-warning"></i> Ambience On';
                } catch (e) {
                    console.log("Web Audio not supported");
                }
            } else {
                if (this.audioCtx.state === 'running') {
                    this.audioCtx.suspend();
                    this.isAudioPlaying = false;
                    if (btn) btn.innerHTML = '<i class="bi bi-volume-mute-fill me-1"></i> Ambience Muted';
                } else {
                    this.audioCtx.resume();
                    this.isAudioPlaying = true;
                    if (btn) btn.innerHTML = '<i class="bi bi-volume-up-fill me-1 text-warning"></i> Ambience On';
                }
            }
        },

        startProceduralAmbience: function () {
            if (!this.audioCtx) return;

            // Generate soft, warm pink noise room atmosphere (library air)
            const bufferSize = this.audioCtx.sampleRate * 2;
            const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            let b0 = 0, b1 = 0, b2 = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                b0 = 0.99886 * b0 + white * 0.0555179;
                b1 = 0.99332 * b1 + white * 0.0750759;
                b2 = 0.96900 * b2 + white * 0.1538520;
                data[i] = (b0 + b1 + b2) * 0.02; // Very quiet gentle presence
            }

            const noise = this.audioCtx.createBufferSource();
            noise.buffer = buffer;
            noise.loop = true;

            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 450; // Deep muffled room tone

            const gain = this.audioCtx.createGain();
            gain.gain.value = 0.35;

            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioCtx.destination);
            noise.start();
        },

        playAcousticChime: function () {
            if (!this.audioCtx || this.audioCtx.state !== 'running') return;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, this.audioCtx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.3); // A5

            gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.5);

            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start();
            osc.stop(this.audioCtx.currentTime + 0.5);
        },

        showToast: function (title, body, type = "info") {
            const toastEl = document.getElementById('liveToast');
            if (!toastEl) return;
            const titleEl = document.getElementById('toastTitle');
            const bodyEl = document.getElementById('toastBody');
            if (titleEl) titleEl.textContent = title;
            if (bodyEl) bodyEl.textContent = body;
            const bsToast = new bootstrap.Toast(toastEl);
            bsToast.show();
        },

        getCSRFToken: function () {
            const cookie = document.cookie.split('; ').find(row => row.startsWith('csrftoken='));
            return cookie ? cookie.split('=')[1] : '';
        },

        /**
         * Main WebGL Animation Loop
         */
        animate: function () {
            requestAnimationFrame(() => this.animate());

            const delta = this.clock.getDelta();

            // 1. Update TWEEN interpolation
            if (typeof TWEEN !== 'undefined') {
                TWEEN.update();
            }

            // 2. Update OrbitControls
            if (this.controls) {
                this.controls.update();
            }

            // 3. Update BIBI Librarian Character (Kinematics, Gaze, Walking)
            if (this.bibi) {
                this.bibi.update(delta);
            }

            // 4. Update Ambient Dust Motes
            if (this.ambientParticles) {
                const positions = this.ambientParticles.geometry.attributes.position.array;
                for (let i = 1; i < positions.length; i += 3) {
                    positions[i] -= delta * 0.12; // Gently drift down
                    if (positions[i] < 0.2) positions[i] = 7.5; // Reset to ceiling
                }
                this.ambientParticles.geometry.attributes.position.needsUpdate = true;
                this.ambientParticles.rotation.y += delta * 0.015;
            }

            // 5. Render Scene
            this.renderer.render(this.scene, this.camera);
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => window.BiblioLearn3D.init());
    } else {
        window.BiblioLearn3D.init();
    }
})();
