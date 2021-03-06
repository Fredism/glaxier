import { autoKeySwitch, autoResize, Geometries, Materials, Meshes } from 'glaxier';
import { Exposes } from 'glaxier/exposables';
import { Cameras } from 'glaxier/cameras';
import * as THREE from 'three';

export function render() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    let aspect = window.innerWidth / window.innerHeight, frustumSize = 600;

    const camera = Cameras.perspective({
        fov: 50,
        aspect: 0.5 * aspect,
        near: 1,
        far: 10000,
        position: { z: 2500 }
    });

    const cameraPerspective = Cameras.perspective({
        fov: 50,
        aspect: 0.5 * aspect,
        near: 150,
        far: 1000
    });
    const cameraPerspectiveHelper = new THREE.CameraHelper(cameraPerspective);

    const cameraOrtho = Cameras.orthographic({
        left: 0.5 * frustumSize * aspect / - 2,
        right: 0.5 * frustumSize * aspect / 2,
        top: frustumSize / 2,
        bottom: frustumSize / - 2,
        near: 150,
        far: 1000
    });
    const cameraOrthoHelper = new THREE.CameraHelper(cameraOrtho);

    let activeCamera, activeHelper;
    activeCamera = cameraPerspective;
    activeHelper = cameraPerspectiveHelper;

    // counteract different front orientation of cameras vs rig

    cameraOrtho.rotation.y = Math.PI;
    cameraPerspective.rotation.y = Math.PI;

    const cameraRig = new THREE.Group();

    cameraRig.add(cameraPerspective);
    cameraRig.add(cameraOrtho);

    const mesh = Meshes.mesh(
        Geometries.sphereBuffer(100, 16, 8),
        Materials.meshBasic({ color: 0xffffff, wireframe: true })
    );

    const mesh2 = Meshes.mesh(
        Geometries.sphereBuffer(50, 16, 8),
        Materials.meshBasic({ color: 0x00ff00, wireframe: true }),
        { position: { y: 150 } }
    );
    mesh.add(mesh2);

    var mesh3 = Meshes.mesh(
        Geometries.sphereBuffer(5, 16, 8),
        Materials.meshBasic({ color: 0x0000ff, wireframe: true }),
        { position: { z: 150 } }
    );
    cameraRig.add(mesh3);

    const geometry = Geometries.buffer(),
        vertices = [];

    for (let i = 0; i < 10000; i++) {

        vertices.push(THREE.MathUtils.randFloatSpread(2000)); // x
        vertices.push(THREE.MathUtils.randFloatSpread(2000)); // y
        vertices.push(THREE.MathUtils.randFloatSpread(2000)); // z

    }

    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

    const particles = new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0x888888 }));

    const renderer = new THREE.WebGLRenderer({ antialias: true });

    return {
        container,
        renderer,
        objects: [cameraPerspectiveHelper, cameraOrthoHelper, cameraRig, mesh, particles],
        props: {
            activeCamera: Exposes.prop(camera => activeCamera = camera, () => activeCamera),
            activeHelper: Exposes.prop(helper => activeHelper = helper, () => activeHelper),
        },
        setup: function () {
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.autoClear = false;

            autoResize(this, aspect => {
                renderer.setSize(window.innerWidth, window.innerHeight);

                camera.aspect = 0.5 * aspect;
                camera.updateProjectionMatrix();

                cameraPerspective.aspect = 0.5 * aspect;
                cameraPerspective.updateProjectionMatrix();

                cameraOrtho.left = - 0.5 * frustumSize * aspect / 2;
                cameraOrtho.right = 0.5 * frustumSize * aspect / 2;
                cameraOrtho.top = frustumSize / 2;
                cameraOrtho.bottom = - frustumSize / 2;
                cameraOrtho.updateProjectionMatrix();
            });
            autoKeySwitch(this, {
                "O": {
                    activeCamera: cameraOrtho,
                    activeHelper: cameraOrthoHelper
                },
                "P": {
                    activeCamera: cameraPerspective,
                    activeHelper: cameraPerspectiveHelper
                }
            });
        },
        loop: function () {
            const r = Date.now() * 0.0005;

            mesh.position.x = 700 * Math.cos(r);
            mesh.position.z = 700 * Math.sin(r);
            mesh.position.y = 700 * Math.sin(r);

            mesh.children[0].position.x = 70 * Math.cos(2 * r);
            mesh.children[0].position.z = 70 * Math.sin(r);

            if (this.activeCamera === cameraPerspective) {

                cameraPerspective.fov = 35 + 30 * Math.sin(0.5 * r);
                cameraPerspective.far = mesh.position.length();
                cameraPerspective.updateProjectionMatrix();

                cameraPerspectiveHelper.update();
                cameraPerspectiveHelper.visible = true;

                cameraOrthoHelper.visible = false;

            } else {

                cameraOrtho.far = mesh.position.length();
                cameraOrtho.updateProjectionMatrix();

                cameraOrthoHelper.update();
                cameraOrthoHelper.visible = true;

                cameraPerspectiveHelper.visible = false;

            }

            cameraRig.lookAt(mesh.position);

            renderer.clear();

            this.activeHelper.visible = false;

            renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
            renderer.render(this.scene, this.activeCamera);

            this.activeHelper.visible = true;

            renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
            renderer.render(this.scene, camera);
        },
        title: 'Cameras'
    }

}