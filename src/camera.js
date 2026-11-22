import * as THREE from 'three';

export class ThirdPersonCamera {
  constructor(camera, target) {
    this.camera = camera;
    this.target = target; // Mesh or Object3D with position

    // Spherical coordinates
    this.distance = 7.0;
    this.minDistance = 3.0;
    this.maxDistance = 18.0;

    this.theta = 0.0; // horizontal angle
    this.phi = 0.55;  // vertical angle (pitch)
    this.minPhi = 0.15;
    this.maxPhi = 1.35;

    this.sensitivity = 0.0035;
    this.zoomSpeed = 0.8;

    this.currentPosition = new THREE.Vector3();
    this.currentTarget = new THREE.Vector3();
    this.lookOffset = new THREE.Vector3(0, 1.25, 0);

    // Initial positioning
    if (this.target) {
      this.currentTarget.copy(this.target.position).add(this.lookOffset);
      this.updateCameraInstant();
    }
  }

  handleInput(input) {
    const mouse = input.consumeMouseDelta();
    if (mouse.x !== 0 || mouse.y !== 0) {
      this.theta -= mouse.x * this.sensitivity;
      this.phi += mouse.y * this.sensitivity;
      this.phi = Math.max(this.minPhi, Math.min(this.maxPhi, this.phi));
    }

    const zoom = input.consumeZoomDelta();
    if (zoom !== 0) {
      this.distance += zoom * this.zoomSpeed;
      this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, this.distance));
    }
  }

  updateCameraInstant() {
    if (!this.target) return;
    const center = this.target.position.clone().add(this.lookOffset);
    const offsetX = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
    const offsetY = this.distance * Math.cos(this.phi);
    const offsetZ = this.distance * Math.sin(this.phi) * Math.cos(this.theta);

    this.camera.position.set(center.x + offsetX, center.y + offsetY, center.z + offsetZ);
    this.camera.lookAt(center);
  }

  update(delta) {
    if (!this.target) return;

    const desiredTarget = this.target.position.clone().add(this.lookOffset);
    // Smooth target follow
    this.currentTarget.lerp(desiredTarget, Math.min(1.0, delta * 12));

    // Calculate desired position based on angles
    const offsetX = this.distance * Math.sin(this.phi) * Math.sin(this.theta);
    const offsetY = this.distance * Math.cos(this.phi);
    const offsetZ = this.distance * Math.sin(this.phi) * Math.cos(this.theta);

    const desiredPosition = new THREE.Vector3(
      this.currentTarget.x + offsetX,
      this.currentTarget.y + offsetY,
      this.currentTarget.z + offsetZ
    );

    // Smooth camera position damping
    this.camera.position.lerp(desiredPosition, Math.min(1.0, delta * 10));
    this.camera.lookAt(this.currentTarget);
  }

  getForwardVector() {
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  getRightVector() {
    const forward = this.getForwardVector();
    const right = new THREE.Vector3();
    right.crossVectors(new THREE.Vector3(0, 1, 0), forward).normalize();
    return right.negate();
  }
}
