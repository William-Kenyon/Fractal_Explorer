#version 410
uniform ivec2 iResolution;
uniform dvec2 centre;
uniform float zoom;
uniform float color_scale;
uniform float max_iters;
uniform float bailout;
uniform float rotation;
uniform int variant;
uniform int fancy_color;
uniform int color_offset;


#define MANDELCUBE 3
#define COLLATZ 4
#define NOVA 5

#define MAGNET1 1
#define MAGNET2 2
#define PHOENIX 0

#define V1 6
#define V2 7
#define V3 8
#define V4 9
#define V5 10

#define num_variants 11

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

const float PI = 3.141592653589793;

// ========MATH FUNCTIONS (c=complex, r=real)========
    
    vec2 mult_cr(vec2 c, float r) {return vec2(c.x*r, c.y*r);}
    vec2 mult_cc(vec2 ab, vec2 cd) {return vec2(ab.x*cd.x - ab.y*cd.y, ab.x*cd.y + ab.y*cd.x);}
    vec2 add_cc(vec2 ab, vec2 cd) {return vec2(ab.x + cd.x, ab.y + cd.y);}
    vec2 sub_cc(vec2 ab, vec2 cd) {return vec2(ab.x - cd.x, ab.y - cd.y);}
    
    vec2 cos_c(vec2 c) {return vec2(cos(c.x)*cosh(c.y), -sin(c.x)*sinh(c.y));}
    vec2 sin_c(vec2 c) {return vec2(sin(c.x)*cosh(c.y),  cos(c.x)*sinh(c.y));}

    float magn_c(vec2 c) {return pow(c.x*c.x + c.y*c.y, 0.5);}
    vec2 exp_c(vec2 c) {float ex = exp(c.x); return vec2(ex*cos(c.y), ex*sin(c.y));}

    vec2 divide_cc(vec2 ab, vec2 cd) {
        float a = ab.x;
        float b = ab.y;
        float c = cd.x;
        float d = cd.y;
        float c2_d2 = c*c + d*d;
        float real = (a*c + b*d) / (c2_d2);
        float imag = (b*c - a*d) / (c2_d2);
        return vec2(real, imag);
    }

    vec2 power_cr(vec2 c, int n) {
        vec2 product = c;
        int i = 1;
        while (i < n) {
            product = mult_cc(product, c);
            i++;
        }
        return product;
    }

    vec2 power_cc(vec2 ab, vec2 cd) {
        // (a+bi)^(c+di)
        // using polar (r,θ):
        //  = e ^ ( ln(r)(c+id) + iθ(c+id) )
        //  = e ^ (f+gi)
        //  = e^f cos(g), e^f sin(g)
        float r = magn_c(ab);
        float theta = atan(ab.y/ab.x);
        vec2 term1 = mult_cr(cd, log(r));
        vec2 term2 = vec2(-theta*cd.y, theta*cd.x);
        return exp_c(add_cc(term1, term2));
    }

    vec2 rotate_c(vec2 c) {
        float trans_x = c.x - float(centre.x);
        float trans_y = c.y - float(centre.y);
        float nx = trans_x*cos(rotation) - trans_y*sin(rotation);
        float ny = trans_y*cos(rotation) + trans_x*sin(rotation);
        return vec2(float(centre.x) + nx, float(centre.y) + ny);
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


float variations(vec2 c) {
    vec2 z = c;
    vec2 oldz = c;
    float iter = 0.0;

    switch (variant % num_variants) {
        case MANDELCUBE:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                z = add_cc(power_cc(z, vec2(bailout/300 + 1, 0)), c);
                iter++;
            }
            break;
        
        case MAGNET1:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 numerator = add_cc(add_cc(power_cr(z, 2), c), vec2(-1,0));
                vec2 denominator = add_cc(add_cc(mult_cr(z, 2), c), vec2(-2,0));
                vec2 quotient = divide_cc(numerator, denominator);
                z = power_cr(quotient, 2);
                iter++;
            }
            break;

        case MAGNET2:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 cube = power_cr(add_cc(z, vec2(-1, 0)), 2);
                vec2 product_z3 = mult_cr(power_cr(z, 2), 3);
                vec2 quotient = divide_cc(cube, product_z3);
                z = sub_cc(add_cc(z, c), quotient);
                iter++;
            }
            break;

        case PHOENIX:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 sumcz = add_cc(vec2(-0.4, 0.1), mult_cr(oldz, 0.2955));
                oldz = z;
                z = add_cc(mult_cc(z, z), sumcz);
                iter++;
            }
            break;

        case COLLATZ:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 cosz = cos_c(mult_cr(z, PI));
                vec2 productz = mult_cc(cosz, vec2(5*z.x+2, 5*z.y));
                vec2 sumz = sub_cc(vec2(7*z.x+2, 7*z.y), productz);
                z = mult_cr(sumz, 0.25);
                iter++;
            }
            if (fancy_color == 0) {iter *= 7;} //is quite dim when uncolored
            break;
        
        case NOVA:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                z = add_cc(mult_cc(z, z), mult_cr(c, 2));
                iter++;
            }
            break;
        
        case V1:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 denominator = add_cc(exp_c(z), c);
                z = divide_cc(z, denominator);
                iter++;
            }
            break;
        
        case V2:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 powzz = power_cc(z, z);
                vec2 quotient = divide_cc(c, z);
                z = sub_cc(powzz, quotient);
                iter++;
            }
            break;

        case V3:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
               vec2 zsqr = mult_cc(z, z);
                vec2 zcube = mult_cc(zsqr, z);
                vec2 numerator = add_cc(zsqr, z);
                vec2 denominator = add_cc(zcube, c);
                z = divide_cc(numerator, denominator);
                iter++;
            }
            break;

        case V4:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 zc_sum = add_cc(z, c);
                vec2 zc_sqr = mult_cc(zc_sum, zc_sum);
                vec2 zc_cube = mult_cc(zc_sqr, zc_sum);
                z = divide_cc(vec2(1,0), zc_cube);
                iter++;
            }
            break;

        case V5:
            while (z.x*z.x + z.y*z.y < bailout && iter < max_iters) {
                vec2 z_sqr = mult_cc(z, z);
                vec2 product_z2c = mult_cc(z_sqr, c);
                z = exp_c(product_z2c);
                iter++;
            }
            break;
    }

    if (iter >= max_iters) {return 0.0;}
    if (fancy_color == 1) {return iter+1-log(log(z.x*z.x+z.y*z.y)*0.5)*1.4427;}
    else {return iter;}
}



void main() {
    dvec2 uv = gl_FragCoord.xy / iResolution.xy;
    double aspect_ratio = double(iResolution.y) / double(iResolution.x);
    double xscale = uv.x*2-1;
    double yscale = uv.y*2-1;

    double xradius = 2*zoom;
    double yradius = xradius*aspect_ratio;

    vec2 c = vec2(float(centre.x+xscale*xradius), float(centre.y-yscale*yradius));
    c = rotate_c(c);
    float iters = variations(c);
    
    if (fancy_color == 1) {gl_FragColor = map_to_color(iters);}
    else {gl_FragColor = vec4(vec3(iters/100), 1);} //max_iters*color_scale
}