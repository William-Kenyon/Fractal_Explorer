#pragma ONCE

extern unsigned int shaderProgram;
extern unsigned int vao;
extern unsigned int vbo;
extern std::string user_input;

struct vec2 {
	float x;
	float y;
};

struct keystates {
	bool shift, ctrl;

	bool up, down, left, right;
	bool q, e;
	bool one, two;
	bool space;
	
	int input_mode = 1;
	
	void set_defaults();
	void update(GLFWwindow* window, int key, int scancode, int action, int mods);
};

struct gamestate {
	int mode; //mandelbrot, variation, pendulum etc...
	int variant; //variations on the mandelbrot formula

	double x_centre;
	double y_centre;
	float max_iters;
	float bailout;

	int fancy_color;
	float color_scale;
	float color_offset;
	
	float rotation;
	float zoom;
	float move_speed;

	void set_defaults();
	void output_values();
	void update(keystates ks);
};

struct windowstate {
	int win_width;
	int win_height;
	bool fullscreen;

	void init(int width, int height, bool fullscreen);
};
