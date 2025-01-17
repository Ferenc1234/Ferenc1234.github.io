// Module aliases
const { Engine, Render, World, Bodies, Body } = Matter;

// Create an engine
const engine = Engine.create();
const world = engine.world;

// Create a renderer
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: window.innerWidth,
    height: window.innerHeight,
    wireframes: false,
    background: '#f4f4f4',
  }
});

// Create ground
const ground = Bodies.rectangle(400, window.innerHeight - 30, window.innerWidth, 60, {
  isStatic: true,
  render: {
    fillStyle: 'green'
  }
});

// Add ground to the world
World.add(world, ground);

// Function to spawn a new ball
function spawnBall() {
  const ball = Bodies.circle(Math.random() * window.innerWidth, 100, 40, {
    restitution: 0.7, // bounciness of the ball
    render: {
      fillStyle: 'blue'
    }
  });

  // Add the ball to the world
  World.add(world, ball);
}

// Button click event to spawn a new ball
document.getElementById('spawnBtn').addEventListener('click', spawnBall);

// Run the engine and renderer
Engine.run(engine);
Render.run(render);

// Resize the canvas dynamically when the window size changes
window.addEventListener('resize', () => {
  render.options.width = window.innerWidth;
  render.options.height = window.innerHeight;
  render.canvas.width = window.innerWidth;
  render.canvas.height = window.innerHeight;
});
