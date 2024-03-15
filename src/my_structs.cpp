#include <iostream>
#include <cmath>
#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <string>
#include "my_structs.h"
#include "my_gui.h"

#define PI 3.141592653589793

vec2 rotate(float x, float y, float rotation) {
	float nx = x*cos(rotation) - y*sin(rotation);
	float ny = y*cos(rotation) + x*sin(rotation);
	return vec2{nx, ny};
}

void keystates::set_defaults() {
	shift = false;
	ctrl = false;

	up = false;
	down = false;
	left = false;
	right = false;
	q = false;
	e = false;

	one = false;
	two = false;
	space = false;
}

void gamestate::set_defaults() {
    x_centre = 0.0;
    y_centre = 0.0;
    max_iters = 300.0;
    bailout = 100.0;

    fancy_color = 1;
    color_scale = 1.0;
    color_offset = 12.0;

    rotation = 0.0;
    zoom = 2.0;
    move_speed = 0.02;
}

void windowstate::init(int width, int height, bool is_fullscreen) {
	win_width  = width;
    win_height = height;
	fullscreen = is_fullscreen;
}


void keystates::update(GLFWwindow* window, int key, int scancode, int action, int mods) {
    if (action == GLFW_PRESS && key == GLFW_KEY_ESCAPE) {
		glfwSetWindowShouldClose(window, 1);
		return;
	} 

	if (ks.input_mode > 1) {
		if (action == GLFW_PRESS) {return;}

		double* centre;
		if (ks.input_mode == 2) {centre = &gs.x_centre;}
		if (ks.input_mode == 3) {centre = &gs.y_centre;}
		if (key == GLFW_KEY_ENTER) {
			ks.input_mode = 1;
			try {*centre = std::stod(user_input);}
			catch (std::invalid_argument) {std::cout << "Invalid arguement for std::stod(user_input)\n" << user_input << std::endl;}
		}
		
		if (key == GLFW_KEY_C) {
			user_input = "";
		}

		if (key == GLFW_KEY_MINUS) {
			user_input.append("-");
		}

		if (key >= GLFW_KEY_0 && key <= GLFW_KEY_9) {
			int new_digit = key - GLFW_KEY_0;
			user_input.append(std::to_string(new_digit));
		}

		if (key == GLFW_KEY_PERIOD) {
			user_input.append(".");
		}

		if (key == GLFW_KEY_BACKSPACE) {
			if (user_input.length() != 0) {user_input.pop_back();}
		}

		//std::cout << user_input << std::endl;
		return;
	}
	

	if (action == GLFW_RELEASE) {
        switch (key) {
            case GLFW_KEY_R:
                gs.set_defaults();
                break;
            case GLFW_KEY_P:
                gs.output_values();
                break;
            case GLFW_KEY_C:
                gs.fancy_color = 1 - gs.fancy_color;
                break;

			case GLFW_KEY_X:
				ks.input_mode = 2;
				user_input = "";
				ks.set_defaults();
				return;
			case GLFW_KEY_Y:
				ks.input_mode = 3;
				user_input = "";
				ks.set_defaults();
				return;

			case GLFW_KEY_U:
				gs.variant -= 1;
				if (gs.variant == -1) {gs.variant = 0;}
				break;
			case GLFW_KEY_I:
				gs.variant++;
				break;
			case GLFW_KEY_O:
				gs.mode++;
				if (gs.mode == 3) {gs.mode = 0;}
				switch (gs.mode) {
					case 0:
						create_gl_program("shader.vert", "mandelbrot.frag");
						break;
					case 1:
						create_gl_program("shader.vert", "variations.frag");
						break;
					case 2:
						create_gl_program("shader.vert", "pendulum.frag");
						break;
				}
				break;
        }
    }

    if (action == GLFW_RELEASE || action == GLFW_PRESS) {
		switch (key) {
			case GLFW_KEY_LEFT_SHIFT:
				shift = action;
				break;
			case GLFW_KEY_LEFT_CONTROL:
				ctrl = action;
				break;
            case GLFW_KEY_W:
                up = action;
                break;
            case GLFW_KEY_S:
                down = action;
                break;
            case GLFW_KEY_A:
				left = action;
                break;
            case GLFW_KEY_D:
                right = action;
                break;

			case GLFW_KEY_Q:
				q = action;
				break;
			case GLFW_KEY_E:
				e = action;
				break;
				
			case GLFW_KEY_SPACE:
				space = action;
				break;
			case GLFW_KEY_1:
				one = action;
				break;
			case GLFW_KEY_2:
				two = action;
				break;
			
            /*
			case GLFW_KEY_O:
				if (action == GLFW_PRESS) {break;}
				path_index = (path_index + 1) % 3;
				create_gl_program();
				break;
            */
		}
		return;
	}
}



void gamestate::output_values() {
    printf("------------------\n");
    system("screenCapture output/output.png");
    printf("Real: %.20f\n", x_centre);
    printf("Imag: %.20f\n", y_centre);
    printf("Zoom: %.20f\n", zoom);
}

void gamestate::update(keystates ks) {
	vec2 rotated;
	if (ks.up) {
		rotated = rotate(0, -move_speed*zoom, rotation);
		x_centre += rotated.x; y_centre += rotated.y;}

	if (ks.down) {
        rotated = rotate(0, move_speed*zoom, rotation);
		x_centre += rotated.x; y_centre += rotated.y;}

	if (ks.left) {
        rotated = rotate(-move_speed*zoom, 0, rotation);
		x_centre += rotated.x; y_centre += rotated.y;}

	if (ks.right) {
        rotated = rotate( move_speed*zoom, 0, rotation);
		x_centre += rotated.x; y_centre += rotated.y;}

	if (ks.space) {
		if (ks.shift) {zoom *= 1.04;}
		else {zoom /= 1.03;}
	}

	if (ks.q) {
		if (ks.shift && ks.ctrl) {color_offset -= 0.3;}
		else if (ks.shift) {bailout /= 1.05;}
		else if (ks.ctrl) {color_scale /= 1.02;}
		else {max_iters /= 1.04;}
	}

	if (ks.e) {
		if (ks.shift && ks.ctrl) {color_offset += 0.3;}
		else if (ks.shift) {bailout *= 1.05;}
		else if (ks.ctrl) {color_scale *= 1.02;}
		else {max_iters *= 1.04;}
	}

	if (ks.one) {rotation -= PI/200;}
	if (ks.two) {rotation += PI/200;}
}