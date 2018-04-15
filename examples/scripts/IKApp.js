const Y_AXIS = new THREE.Vector3(0, 1, 0);
const BONES = 4;
const HEIGHT = 0.5;

class Arrow extends THREE.Mesh {
  constructor() {
    const geo = new THREE.ConeBufferGeometry(0.05, 0.1, 10);
    geo.applyMatrix(new THREE.Matrix4().makeRotationAxis(new THREE.Vector3(1, 0, 0), Math.PI/2));
    super(geo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
  }
}

class IKApp {
  constructor() {
    this.animate = this.animate.bind(this);
    this.onChange = this.onChange.bind(this);
    this.onWindowResize = this.onWindowResize.bind(this);

    this.gui = new dat.GUI();
    this.config = {};

    if (this.setupGUI) {
      this.setupGUI();
    }

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xeeeeee);

    this.camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100);
    this.camera.position.set(10, 5, 6);
    this.camera.lookAt(this.scene.position);

    this.scene.add(new THREE.AmbientLight(0xffffff, 1));
    this.light = new THREE.DirectionalLight( 0xffffff );
    this.light.position.set(10, 10, 0);
    //this.light.castShadow = true;
    this.scene.add(this.light);

    this.mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshPhongMaterial({ color: 0x555555 })
    );
    this.mesh.rotation.x = - Math.PI / 2;
    //this.mesh.receiveShadow = true;
    this.scene.add(this.mesh);

    this.grid = new THREE.GridHelper( 20, 20, 0x000000, 0x000000 );
    this.grid.position.y = 0.001;
    this.grid.material.opacity = 1;
    this.scene.add(this.grid);

    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    //this.renderer.shadowMap.enabled = true;
    //this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.update();

    this.gizmos = [];

    this.bones = [];

    this.setupIK();

    if (!this.bones.length) {
      throw new Error('`setupIK()` must construct an array of bones');
    }

    if (!this.ik) {
      throw new Error('`setupIK()` must construct `this.ik`');
    }

    this.skeletonHelper = new THREE.SkeletonHelper(this.bones[0]);
    this.skeletonHelper.material.linewidth = 10;
    this.scene.add(this.skeletonHelper);

    window.addEventListener('resize', this.onWindowResize, false);

    // Fire on change event so we can wire up any defaults
    this.onChange();

    this.animate();
  }

  createTarget(position) {
    const gizmo = new THREE.TransformControls(this.camera, this.renderer.domElement);
    const target = new THREE.Object3D();
    gizmo.setSize(0.5);
    gizmo.attach(target);
    gizmo.target = target;
    target.position.copy(position);

    this.scene.add(gizmo);
    this.scene.add(target);
    this.gizmos.push(gizmo);

    return target;
  }

  animate() {
    requestAnimationFrame(this.animate);

    for (let gizmo of this.gizmos) {
      gizmo.update();
    }

    this.ik.update();

    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  onChange() {
  }

  addGUI(name, values, defaultValue) {
    this.config[name] = defaultValue === undefined ? values : defaultValue;
    const controller = this.gui.add(this.config, name, values);
    controller.onChange(this.onChange);

    return controller;
  }
};