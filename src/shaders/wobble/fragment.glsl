varying float vWobble;

uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;

void main() {

    float colorMix = smoothstep(-1.0, 1.0, vWobble);

    vec3 color = mix(uPrimaryColor, uSecondaryColor,colorMix);

    csm_DiffuseColor.rgb = color;

    // Mirror step
    // csm_Metalness = step(0.25, vWobble);
    // csm_Roughness = 1.0 - csm_Metalness;

    csm_Roughness = 1.0 - colorMix;

}