#include <GL/glew.h>
#include <GLFW/glfw3.h>
#include <windows.h>
#include <string>
#include "my_utils.h"
#include "my_gui.h"

keystates ks;
gamestate gs;
windowstate ws;
unsigned int shaderProgram;
unsigned int vao;
unsigned int vbo;
std::string user_input;

int main(int argc, char* argv[]) {
	gs.set_defaults();
	ks.set_defaults();
	ws.init(1600, 900, false);

	GLFWwindow* window = setup_gl();
	create_gl_program("shader.vert", "mandelbrot.frag");
	set_gl_uniforms();

	while (!glfwWindowShouldClose(window)) {
		gs.update(ks);
		set_gl_uniforms();

		glClear(GL_COLOR_BUFFER_BIT);
		glDrawArrays(GL_TRIANGLES, 0, 6);
		glfwSwapBuffers(window);
		glfwPollEvents();

		Sleep(10);
	}

	shutdown_gl(window);
	return 0;
}
