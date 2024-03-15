#version 410
uniform ivec2 iResolution;
uniform dvec2 centre;
uniform float zoom;
uniform float color_scale;
uniform float max_iters;
uniform float bailout;
uniform float rotation;
uniform int mode;
uniform int fancy_color;
uniform int color_offset;


#define PRETTY_PALETTE


#ifdef DEFAULT_PALETTE
const int cols = 16;
uniform vec3 palette[cols] = {
	vec3(66, 30, 15),
	vec3(25, 7, 26),
	vec3(9, 1, 47),
	vec3(4, 4, 73),
	vec3(0, 7, 100),
	vec3(12, 44, 138),
	vec3(24, 82, 177),
	vec3(57, 125, 209),
	vec3(134, 181, 229),
	vec3(211, 236, 248),
	vec3(241, 233, 191),
	vec3(248, 201, 95),
	vec3(255, 170, 0),
	vec3(204, 128, 0),
	vec3(153, 87, 0),
	vec3(106, 52, 3)
};
#endif
#ifdef UGLY_PALETTE
const int cols = 12;
uniform vec3 palette[cols] = {
	vec3(120, 205, 203),
	vec3(120, 119, 243),
	vec3(184, 119, 203),
	vec3(206, 122, 203),
	vec3(207, 119, 180),
	vec3(247, 119, 116),
	vec3(248, 151, 116),
	vec3(248, 183, 116),
	vec3(245, 223, 158),
	vec3(248, 247, 117),
	vec3(120, 247, 117),
	vec3(138, 229, 116)
};
#endif
#ifdef PRETTY_PALETTE
const int cols = 25;
uniform vec3 palette[cols] = {
	vec3(226, 217, 226),
	vec3(209, 213, 218),
	vec3(179, 198, 206),
	vec3(149, 181, 199),
	vec3(123, 161, 194),

	vec3(107, 140, 191),
	vec3(98, 118, 186),
	vec3(95, 94, 179),
	vec3(94, 67, 165),
	vec3(89, 42, 143),

	vec3(78, 24, 111),
	vec3(61, 17, 77),
	vec3(47, 20, 54),
	vec3(63, 18, 61),
	vec3(88, 22, 71),

	vec3(116, 30, 79),
	vec3(142, 44, 80),
	vec3(162, 64, 80),
	vec3(178, 86, 82),
	vec3(190, 111, 91),

	vec3(198, 138, 109),
	vec3(204, 163, 137),
	vec3(212, 188, 172),
	vec3(221, 208, 206),
	vec3(226, 217, 226)
};
#endif

bool in_cardiod_or_bulb(dvec2 c) {
	double x = c.x;
	double y = c.y;
	double x2 = x*x;
	double y2 = y*y;
	if (x2+x+x+1+y2 <= 0.0625) {return true;}
	double q = x2 - 0.5*x + 0.0625 + y2;
	if (q*(q+x-0.25) <= 0.25*y2) {return true;}
	return false;
}

vec4 map_to_color(float iter) {
	if (iter == 0) {return vec4(0., 0., 0., 1.);}
	vec3 col1 = palette[int(mod(iter*color_scale + color_offset, cols))];
	vec3 col2 = palette[int(mod(iter*color_scale+1 + color_offset, cols))];
	float t = fract(iter*color_scale);
	float r = col1.x * (1-t) + col2.x * t;
	float g = col1.y * (1-t) + col2.y * t;
	float b = col1.z * (1-t) + col2.z * t;
	return vec4(r/255., g/255., b/255., 1.);
}

dvec2 rotate_c(dvec2 c) {
	double trans_x = c.x - centre.x;
	double trans_y = c.y - centre.y;
	double nx = trans_x*cos(rotation) - trans_y*sin(rotation);
	double ny = trans_y*cos(rotation) + trans_x*sin(rotation);
	return dvec2(centre.x + nx, centre.y + ny);
}

double optimised_mandelbrot(dvec2 c) {
	if (in_cardiod_or_bulb(c)) {return 0;}
	dvec2 z = c;
	double x2 = z.x * z.x;
	double y2 = z.y * z.y;
	double iter = 0.;
	while (x2 + y2 < bailout && iter < max_iters) {
		z.y = z.x * z.y * 2 + c.y;
		z.x = x2 - y2 + c.x;
		x2 = z.x * z.x;
		y2 = z.y * z.y;
		iter++;
	}

	if (iter >= max_iters) {return 0;}
	if (fancy_color == 1) {return iter+1-log(log(float(x2+y2)) * 0.5) * 1.4426954167;}
	else {return iter;}
}


void main() {
	dvec2 uv = gl_FragCoord.xy / iResolution.xy;
	double aspect_ratio = double(iResolution.y) / double(iResolution.x);
	double xscale = uv.x*2-1;
	double yscale = uv.y*2-1;
	
	#if defined(RETICLE)
		double rad = xscale*xscale + (yscale*aspect_ratio)*(yscale*aspect_ratio);
		if (rad < 0.00003) {
			if (rad < 0.00002) {gl_FragColor = vec4(1,0,0,1);}
			else {gl_FragColor = vec4(0,0,0,1);}
			return;
		}
	#endif

	double xradius = 2*zoom;
	double yradius = xradius*aspect_ratio;
	dvec2 c = dvec2(centre.x + xscale*xradius, centre.y - yscale*yradius);
	c = rotate_c(c);
	float iters = float(optimised_mandelbrot(c));

	if (fancy_color == 1) {gl_FragColor = map_to_color(iters);}
	else {gl_FragColor = vec4(vec3(iters/max_iters*color_scale), 1);}
}
