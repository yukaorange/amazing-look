import GSAP from 'gsap'

import { ShaderMaterial, Mesh } from 'three'
import * as THREE from 'three'

import vertex from '@js/shaders/vertex.glsl'
import fragment from '@js/shaders/fragment.glsl'

export default class Human {
  constructor({ sizes, device }) {
    this.modelScene = window.DRACO_MODEL.scene

    this.model = window.DRACO_MODEL.scene.children[0]

    this.sizes = sizes

    this.device = device

    this.createMaterial()

    this.createMesh()

    this.calculateBounds({
      sizes: this.sizes,
      device: this.device
    })
  }

  createTexture() {}

  createMaterial() {
    this.material = new THREE.MeshStandardMaterial({
      envMap: window.ENV_MAP,
      metalness: 1.0,
      roughness: 0.1
    })

    this.material.onBeforeCompile = shader => {
      shader.uniforms.uTime = { value: 0 }

      shader.fragmentShader =
        /* glsl */ `
        uniform float uTime;

        mat4 rotationMatrix(vec3 axis, float angle) {
          axis = normalize(axis);
          float s = sin(angle);
          float c = cos(angle);
          float oc = 1.0 - c;
          
          return mat4(oc * axis.x * axis.x + c,           oc * axis.x * axis.y - axis.z * s,  oc * axis.z * axis.x + axis.y * s,  0.0,
                      oc * axis.x * axis.y + axis.z * s,  oc * axis.y * axis.y + c,           oc * axis.y * axis.z - axis.x * s,  0.0,
                      oc * axis.z * axis.x - axis.y * s,  oc * axis.y * axis.z + axis.x * s,  oc * axis.z * axis.z + c,           0.0,
                      0.0,                                0.0,                                0.0,                                1.0);
      }
      
      vec3 rotate(vec3 v, vec3 axis, float angle) {
        mat4 m = rotationMatrix(axis, angle);
        return (m * vec4(v, 1.0)).xyz;
      }
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <envmap_physical_pars_fragment>`,
        /* glsl */ `
        #ifdef USE_ENVMAP

          vec3 getIBLIrradiance( const in vec3 normal ) {

        #ifdef ENVMAP_TYPE_CUBE_UV

          vec3 worldNormal = inverseTransformDirection( normal, viewMatrix );

          vec4 envMapColor = textureCubeUV( envMap, worldNormal, 1.0 );

          return PI * envMapColor.rgb * envMapIntensity;

        #else

          return vec3( 0.0 );

        #endif

        }

        vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {

          #ifdef ENVMAP_TYPE_CUBE_UV

            vec3 reflectVec = reflect( - viewDir, normal );

            // Mixing the reflection with the normal is more accurate and keeps rough objects from gathering light from behind their tangent plane.
            reflectVec = normalize( mix( reflectVec, normal, roughness * roughness) );

            reflectVec = rotate(reflectVec, vec3(0.0, 1.0, 0.0), uTime);

            reflectVec = inverseTransformDirection( reflectVec, viewMatrix );

            vec4 envMapColor = textureCubeUV( envMap, reflectVec, roughness );

            return envMapColor.rgb * envMapIntensity;

          #else

            return vec3( 0.0 );

          #endif

        }

        #ifdef USE_ANISOTROPY

          vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {

            #ifdef ENVMAP_TYPE_CUBE_UV

              // https://google.github.io/filament/Filament.md.html#lighting/imagebasedlights/anisotropy
              vec3 bentNormal = cross( bitangent, viewDir );
              bentNormal = normalize( cross( bentNormal, bitangent ) );
              bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );

              return getIBLRadiance( viewDir, bentNormal, roughness );

            #else

              return vec3( 0.0 );

            #endif

          }

        #endif

      #endif
        `
      )

      this.material.userData.shader = shader
    }
  }

  createMesh() {
    this.model.material = this.material
  }

  setModelProperties() {
    const normalize = this.sizes.width / 7.36

    let scale

    if (this.device == 'sp') {
      scale = 0.35 * normalize
    } else if (this.device == 'pc') {
      scale = 0.175 * normalize
    }

    this.model.position.set(0, 0, 0)

    this.model.geometry.center()

    this.model.rotation.x = Math.PI * (3 / 2)

    this.model.scale.set(scale, scale, scale)
  }

  calculateBounds({ sizes, device }) {
    this.sizes = sizes

    this.device = device

    this.updateScale(this.device)

    this.updateX()

    this.updateY()
  }

  /**
   * Animations
   */
  show() {}

  hide() {}
  /**
   * events
   */
  onResize(value) {
    this.calculateBounds(value)

    this.setModelProperties()
  }

  /**
   * update
   */

  updateScale() {}

  updateX(x = 0) {}

  updateY(y = 0) {}

  update({ scroll, time }) {
    this.updateX(scroll.x)

    this.updateY(scroll.y)

    if (this.material.userData.shader) {
      this.material.userData.shader.uniforms.uTime.value = time.current
    }
  }
}
