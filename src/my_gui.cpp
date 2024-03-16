#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <cmath>
#include <iostream>
#include <fstream>
#include "my_utils.h"
#include "my_gui.h"

void set_gl_uniforms() {
	glUniform2i(glGetUniformLocation(shaderProgram, "iResolution"), ws.win_width, ws.win_height);
	glUniform2d(glGetUniformLocation(shaderProgram, "centre"), gs.x_centre, gs.y_centre);
	glUniform1f(glGetUniformLocation(shaderProgram, "zoom"), gs.zoom);
	glUniform1f(glGetUniformLocation(shaderProgram, "rotation"), gs.rotation);
	glUniform1f(glGetUniformLocation(shaderProgram, "color_scale"), gs.color_scale);
	glUniform1f(glGetUniformLocation(shaderProgram, "max_iters"), round(gs.max_iters));
	glUniform1f(glGetUniformLocation(shaderProgram, "bailout"), gs.bailout);
	glUniform1i(glGetUniformLocation(shaderProgram, "variant"), gs.variant);
	glUniform1i(glGetUniformLocation(shaderProgram, "fancy_color"), gs.fancy_color);
	glUniform1i(glGetUniformLocation(shaderProgram, "color_offset"), (int)round(gs.color_offset));
}


void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods) {
	ks.update(window, key, scancode, action, mods);
	gs.update(ks);
}


GLFWwindow* setup_gl() {
	if (!glfwInit()) {printf("Failed to initialise GLFW\n");}
	glfwWindowHint(GLFW_CONTEXT_VERSION_MAJOR, 4);
	glfwWindowHint(GLFW_CONTEXT_VERSION_MINOR, 1);
	GLFWwindow* window;
	if (ws.fullscreen) {
		window = glfwCreateWindow(
			ws.win_width, ws.win_height,
			"Fractal_Explorer",
			glfwGetPrimaryMonitor(),
			NULL);
	} else {
		window = glfwCreateWindow(
			ws.win_width, ws.win_height,
			"Fractal_Explorer",
			NULL,
			NULL);
	}
	if (!window) {printf("Failed to create window\n"); glfwTerminate();}
	glfwMakeContextCurrent(window);
	if (!glewInit()) {printf("Failed to initialise GLEW\n");}
	
	glfwSetKeyCallback(window, key_callback);
	glfwSetInputMode(window, GLFW_CURSOR, GLFW_CURSOR_HIDDEN);
	return window;
}


void create_gl_program(std::string vert_shader_path, std::string frag_shader_path) {
	float vertices[12] = {
		-1, -1,
		 1, -1,
		 1,  1,
		 1,  1,
		-1,  1,
		-1, -1
	};

	glGenVertexArrays(1, &vao);
	glBindVertexArray(vao);
	glGenBuffers(1, &vbo);
	glBindBuffer(GL_ARRAY_BUFFER, vbo);
	glBufferData(GL_ARRAY_BUFFER, sizeof(vertices), vertices, GL_STATIC_DRAW);
	glVertexAttribPointer(0, 2, GL_FLOAT, GL_FALSE, 0, 0);
	glEnableVertexAttribArray(0);
	
	unsigned int vertex, fragment;
	int success;
	char infoLog[1024];

	// SETTING UP THE VERTEX SHADER
	std::string line1, text1;
	std::ifstream vertShader(vert_shader_path);
	while (getline(vertShader, line1)) {
		text1 += line1 + "\n";}
	const char* vertexSource = text1.c_str();
	
	vertex = glCreateShader(GL_VERTEX_SHADER);
	glShaderSource(vertex, 1, &vertexSource, NULL);
	glCompileShader(vertex);
	glGetShaderiv(vertex, GL_COMPILE_STATUS, &success);
	if (!success) {
		glGetShaderInfoLog(vertex, 1024, NULL, infoLog);
		printf("vertex shader error:\n%s\n", infoLog);
	}

	// SETTING UP THE FRAGMENT SHADER
	std::string line2, text2;
	std::ifstream fragShader(frag_shader_path);
	while (getline(fragShader, line2)) {
		text2 += line2 + "\n";}
	const char* fragmentSource = text2.c_str();

	fragment = glCreateShader(GL_FRAGMENT_SHADER);
	glShaderSource(fragment, 1, &fragmentSource, NULL);
	glCompileShader(fragment);
	glGetShaderiv(fragment, GL_COMPILE_STATUS, &success);
	if (!success) {
		glGetShaderInfoLog(fragment, 1024, NULL, infoLog);
		printf("fragment shader error:\n%s\n", infoLog);
	}

	// CREATING THE OPENGL PROGRAM
	shaderProgram = glCreateProgram();
	glAttachShader(shaderProgram, vertex);
	glAttachShader(shaderProgram, fragment);
	glLinkProgram(shaderProgram);
	glDeleteShader(vertex);
	glDeleteShader(fragment);
	glUseProgram(shaderProgram);
}


void shutdown_gl(GLFWwindow* window) {
	glDeleteVertexArrays(1, &vao);
	glDeleteBuffers(1, &vbo);
	glDeleteProgram(shaderProgram);
	glfwDestroyWindow(window);
	glfwTerminate();
}
