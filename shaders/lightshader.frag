#define MAXLIGHTS 10

uniform sampler2D normalmap;

uniform int lights;
uniform vec3 lightcolor[MAXLIGHTS];
uniform vec3 lightpos[MAXLIGHTS];
uniform float attenuation[MAXLIGHTS];

uniform vec3 ambientcolor;
uniform float ambientcoeffecient;

uniform int ortholights;
uniform float orthocoeffecient[MAXLIGHTS];
uniform vec3 orthodir[MAXLIGHTS];
uniform vec3 orthocolor[MAXLIGHTS];

// This determines the tiling effect
uniform float scale;
uniform vec2 campos;

uniform vec3 gamma;


vec4 effect(vec4 color, Image texture, vec2 texture_coords, vec2 screen_coords)
{
  // First read the necessary data
  vec2 ncoord = vec2(screen_coords.x, -screen_coords.y) * scale;
  vec3 normal = Texel(normalmap, ncoord).xyz;
  normal = normalize(normal - vec3(0.5));
  vec4 tcolor = Texel(texture, texture_coords);
  vec3 pos = vec3(campos + screen_coords * scale, 0.0);
  // Go through all lights and calculate the diffuse component
  vec3 diffuse = vec3(0.0);
  vec3 specular = vec3(0.0);
  for (int i = 0; i < lights; i++) {
    // First calculate attenuation
    vec3 dlight = lightpos[i] - pos;
    float d = length(dlight);
    float att = 1.0 / (1.0 + attenuation[i] * d * d);
    // Now calculate the raw diffuse component
    vec3 nlight = normalize(dlight);
    float diffcoff = max(0.0, dot(nlight, normal));
    diffuse += att * diffcoff * lightcolor[i] * tcolor.xyz;
    // Now specular component
    vec3 indice = -nlight; //a unit vector
    vec3 reflection = reflect(indice, normal); //also a unit vector
    vec3 surf2cam = vec3(0.0, 0.0, 1.0); //also a unit vector
    float cosAngle = max(0.0, dot(surf2cam, reflection));
    float specularCoefficient = pow(cosAngle, 10);
    specular += att * specularCoefficient * tcolor.xyz * lightcolor[i];
  }
  vec3 ortho = vec3(0.0);
  for (int i = 0; i < ortholights; i++) {
    vec3 nlight = normalize(orthodir[i]);
    float diffcoff = max(0.0, dot(nlight, normal));
    ortho += orthocoeffecient[i] * diffcoff * orthocolor[i] * tcolor.xyz;
  }
  // Calucate the ambient contribution
  vec3 ambient = ambientcolor * tcolor.xyz * ambientcoeffecient;
  // Obtain final linear color
  vec3 lincolor = ambient + diffuse + ortho + specular;
  // lincolor = specular;
  // Now do gamma correction and return result
  return vec4(pow(lincolor, gamma), tcolor.a) * color;
}
