#pragma ONCE

extern keystates ks;
extern gamestate gs;
extern windowstate ws;
extern unsigned int shaderProgram;
extern unsigned int vao;
extern unsigned int vbo;

void set_gl_uniforms();

void key_callback(GLFWwindow* window, int key, int scancode, int action, int mods);

GLFWwindow* setup_gl();

void create_gl_program(std::string vert_shader_path, std::string frag_shader_path);

void shutdown_gl(GLFWwindow* window);
