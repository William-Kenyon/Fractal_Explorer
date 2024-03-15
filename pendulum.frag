#version 410
uniform ivec2 iResolution;
uniform dvec2 centre;
uniform float zoom;
uniform float color_scale;
uniform float max_iters;
uniform float bailout;
const float PI = 3.141592653589793;
const float G = 0.00005;

float clamp_theta(float theta) {
	if (theta < -PI) {return theta + 2*PI;}
	if (theta > PI) {return theta - 2*PI;}
	return theta;
}

vec4 simple_pendulum(vec2 thetas) {
	float t = thetas.x;
	float dt = 0;
	float ddt;
	for (int i = 0; i < max_iters; i++) {
		ddt = -G*sin(t);
		dt += ddt;
		t += dt;
	}
	return vec4(t/PI/2 + 0.5, 0.5, 1, 1);
}

vec4 pendulum(vec2 thetas) {
	float t1 = thetas.x;
	float t2 = thetas.y;
	
	float dt1 = 0;
	float dt2 = 0;
	float num1, num2, num3, num4, den, ddt1, ddt2, dt1_2, dt2_2, sin_t1_t2, cos_t1_t2;
	for (int i = 0; i < max_iters; i++) {
		dt1_2 = dt1*dt1;
		dt2_2 = dt2*dt2;
		sin_t1_t2 = sin(t1-t2);
		cos_t1_t2 = cos(t1-t2);

		num1 = -G*3*sin(t1);
		num2 = -G*sin(t1 - 2*t2);
		num3 = -2*sin_t1_t2;
		num4 = dt2_2 + dt1_2*cos_t1_t2;
		den  = 3 - cos(2*t1 - 2*t2);
		ddt1 = (num1 + num2 + num3 * num4)/den;
		
		num1 = 2*sin_t1_t2;
		num2 = dt1_2*2.;
		num3 = G*2*cos(t1);
		num4 = dt2_2*cos_t1_t2;
		ddt2 = (num1 * (num2 + num3 + num4))/den;
		
		dt1 += ddt1;
		dt2 += ddt2;
		t1 = clamp_theta(t1+dt1);
		t2 = clamp_theta(t2+dt2);
	}
	return vec4(t1/PI/2 + 0.5, t2/PI/2 + 0.5, 1, 1);
}

void main() {
	vec2 uv = gl_FragCoord.xy / iResolution.xy;
	float aspect_ratio = float(iResolution.y) / float(iResolution.x);
	
	float xscale = uv.x*2-1;
	float yscale = uv.y*2-1;
	float xradius = PI*zoom;
	float yradius = xradius * aspect_ratio;
	
	vec2 thetas = vec2(centre.x + xscale*xradius, centre.y - yscale*yradius);
	gl_FragColor = pendulum(thetas);
}
