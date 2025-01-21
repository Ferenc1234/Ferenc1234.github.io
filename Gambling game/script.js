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
    width: 500,
    height: 500,
    wireframes: false,
    background: '#000000',
  }
});

// Create ground
const ground = Bodies.rectangle(250, 500-15, 500, 30, {
  isStatic: true,
  render: {
    fillStyle: 'green'
  }
});

// Add ground to the world
World.add(world, ground);

// Create a function to create a pyramid of circles
function createPyramid(baseX, baseY, radius, rows) {
  let offsetX = 0; // Horizontal offset for each row
  let offsetY = radius * 8; // Vertical offset between rows
  
  for (let row = 1; row <= rows; row++) {
    // For each row, create an increasing number of circles
    for (let i = 0; i < row + 2; i++) {
      let x = baseX + offsetX + i * (radius * 8); // Horizontal positioning
      let y = baseY + offsetY * row; // Vertical positioning

      // Create the circle and add it to the world
      const plinko = Bodies.circle(x, y, radius, {
        isStatic: true,
        render: {
          fillStyle: 'grey',
        },
      });
      World.add(world, plinko);
    }
    // Adjust the horizontal offset for the next row (center alignment)
    offsetX -= radius; 
  }
}

// Create a pyramid starting at a specific position with a radius of 7 and 5 rows
createPyramid(0.5 * window.innerWidth, window.innerHeight / 2, 4, 5);


// Function to spawn a new ball
function spawnBall() {
  const ball = Bodies.circle((0.5 * window.innerWidth) + (Math.random() * 10) - 5, 100, 10, {
    restitution: 0.7, 
    render: {
      fillStyle: 'blue'
    },
    collisionFilter: {
      group: -1  // This ensures the ball does not collide with itself (objects in the same group don't collide)
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
