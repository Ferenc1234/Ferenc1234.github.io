// Module aliases
const { Engine, Render, World, Bodies, Body } = Matter

// Create an engine
const engine = Engine.create()
const world = engine.world
let money = 1000
const priceForBall = 10

// Create a renderer
const render = Render.create({
  element: document.body,
  engine: engine,
  options: {
    width: 500,
    height: 500,
    wireframes: false,
    background: "#2f2b32",
  },
})

// Create ground
const ground = Bodies.rectangle(250, 500 - 25, 500, 50, {
  isStatic: true,
  render: {
    fillStyle: "#f95a37",
  },
  label: "ground",
  text: {
      content: "FN",
      color: "black",
      size: 15
    }
})

// Add ground to the world
World.add(world, ground)

// Create a function to create a pyramid of circles
function createPyramid(baseX, baseY, radius, rows) {
  let offsetX = -32 // Horizontal offset for each row
  let offsetY = radius * 7 // Vertical offset between rows

  for (let row = 1; row <= rows; row++) {
    // For each row, create an increasing number of circles
    for (let i = 0; i < row + 2; i++) {
      let x = baseX + offsetX + i * (radius * 8) // Horizontal positioning
      let y = baseY + offsetY * row - 95 // Vertical positioning

      // Create the circle and add it to the world
      const plinko = Bodies.circle(x, y, radius, {
        isStatic: true,
        render: {
          fillStyle: "grey",
        },
        friction: 0,
      })
      World.add(world, plinko)
    }
    // Adjust the horizontal offset for the next row (center alignment)
    offsetX -= 16
  }
  for (let i = 0; i < 12 + 2; i++) {
    let x = baseX + offsetX + 16 + i * (radius * 8) // Horizontal positioning
    let y = baseY + offsetY * 13 - 95
    const bars = Bodies.rectangle(x, y, radius * 2, 55, {
      isStatic: true,
      render: {
        fillStyle: "grey",
      },
    })
    World.add(world, bars)
  }
}

// Create a pyramid starting at a specific position with a radius of 4 and 5 rows
createPyramid(250, 150, 4, 12)

// Function to spawn a new ball
function spawnBall() {
  if (money >= 0 + priceForBall) {
    moneyCounter()
    const ball = Bodies.circle(250 + Math.random() * 12 - 6, 60, 12, {
      restitution: 1,
      render: {
        fillStyle: "#a7bf2e",
      },
      label: "Ball",
      collisionFilter: {
        group: -1, // This ensures the ball does not collide with itself (objects in the same group don't collide)
      },
    })

    // Add the ball to the world
    World.add(world, ball)
  } else {
    console.log("user ran out of money, hooray!")
  }
}

function moneyCounter() {
  money = money - priceForBall
  console.log(money)
  document.getElementById("moneyCount").innerHTML = "your money: "+money.toFixed(1)
}

// Add collision event listener
Matter.Events.on(engine, "collisionStart", event => {
  event.pairs.forEach(collision => {
    const { bodyA, bodyB } = collision;

    // Check if the collision is between a ball and the ground
    if ((bodyA.label === "Ball" && bodyB.label === "ground") || 
        (bodyA.label === "ground" && bodyB.label === "Ball")) {
      // Set the ball's color to red
      const ball = bodyA.label === "Ball" ? bodyA : bodyB;
      const distanceFromCenter = ball.position.x - 250
      const holeNumber = Math.round((Math.abs(distanceFromCenter)+32)/32);
      console.log("Hole number "+holeNumber)
      Matter.World.remove(world, ball)
      money = money + (holeNumber * (holeNumber+2))
      document.getElementById("moneyCount").innerHTML = "your money: "+money.toFixed(1)

    }
  });
});


// Button click event to spawn a new ball
document.getElementById("spawnBtn").addEventListener("click", spawnBall)
document.getElementById("moneyCount").innerHTML = "your money: "+money.toFixed(1)

// Run the engine and renderer
engine.world.gravity.y = 2
Matter.Runner.run(engine)
Render.run(render)
