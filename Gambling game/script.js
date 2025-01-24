// Module aliases
const { Engine, Render, World, Bodies, Body } = Matter

// Create an engine
const engine = Engine.create()
const world = engine.world
let money = 1000
const priceForBall = 10
let risk = 5
let ballsInGame = 0

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
})

// Add ground to the world
World.add(world, ground)

// Create a function to create a pyramid of dots (plinko board)
function createPyramid(baseX, baseY, radius, rows) {
  let offsetX = -32 // Horizontal offset for each row
  let offsetY = radius * 7 // Vertical offset between rows

  for (let row = 1; row <= rows; row++) {
    // For each row, create an increasing number of dots
    for (let i = 0; i < row + 2; i++) {
      let x = baseX + offsetX + i * (radius * 8) // Horizontal positioning
      let y = baseY + offsetY * row - 95 // Vertical positioning

      // Create the dot and add it to the world
      const plinko = Bodies.circle(x, y, radius, {
        isStatic: true,
        render: {
          fillStyle: "grey",
        },
        friction: 0,
      })
      World.add(world, plinko)
    }
    // Adjust the horizontal offset for the next row
    offsetX -= 16
  }
  for (let i = 0; i < 12 + 2; i++) {
    let x = baseX + offsetX + 16 + i * (radius * 8) // Horizontal positioning
    let y = baseY + offsetY * 13 - 95
    const bars = Bodies.rectangle(x, y + 1, radius * 2, 60, {
      isStatic: true,
      render: {
        fillStyle: "grey",
      },
    })
    World.add(world, bars)
  }
}

// Create a pyramid starting at the middle with a radius of 4 and 12 rows
createPyramid(250, 150, 4, 12)

// Function to spawn a new ball
function spawnBall() {
  if (money >= 0 + priceForBall) {
    moneyCounter()
    const ball = Bodies.circle(250 + Math.random() * 12.0 - 6.0, 60, 12, {
      restitution: 0.65, //DO NOT TOUCH
      friction: 0.05, //DO NOT TOUCH
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
    ballsInGame++
    if (ballsInGame >= 1){
    	lockSlider()
    }
  } else {
    console.log("user ran out of money, hooray!")
  }
}

function moneyCounter() {
  money = money - priceForBall
  console.log("bought 1 ball, new account balance is: " + money)
  document.getElementById("moneyCount").innerHTML =
    "Your Money: " + money.toFixed(1) + "$"
}

// Add collision event listener
Matter.Events.on(engine, "collisionStart", (event) => {
  event.pairs.forEach((collision) => {
    const { bodyA, bodyB } = collision

    // Check if the collision is between a ball and the ground
    if (
      (bodyA.label === "Ball" && bodyB.label === "ground") ||
      (bodyA.label === "ground" && bodyB.label === "Ball")
    ) {
      const ball = bodyA.label === "Ball" ? bodyA : bodyB
      const distanceFromCenter = ball.position.x - 250
      const holeNumber = Math.round((Math.abs(distanceFromCenter) + 32) / 32)
      console.log("------------NEW DROP------------")
      console.log("Old balance: " + money + "$")
      console.log("Hole number " + holeNumber)
      Matter.World.remove(world, ball)
      money = money + calculateReward(holeNumber, risk, priceForBall)
      console.log("Added " + calculateReward(holeNumber, risk, priceForBall) + "$ to account")
      document.getElementById("moneyCount").innerHTML =
        "Your Money: " + money.toFixed(1) + "$"
      console.log("New balance: " + money + "$")
      ballsInGame--
      if (ballsInGame == 0){
      	unlockSlider()
      }
    }
  })
})


function calculateReward(holeNumber, risk, ballPrice) {
    if (ballPrice === undefined){
    	ballPrice = 1
    }
  // Odměny při nízkém riziku (% hodnoty)
    const lowRiskRewards = {
        1: 100, // Prostřední díra
        2: 100,
        3: 100,
        4: 100,
        5: 100,
        6: 100,
        7: 100, // Krajní díry
    };function lockSlider() {
  const slider = document.getElementById('slider');
  const status = document.getElementById('status');
  
  slider.disabled = true;  // Disable the slider
  slider.classList.add('locked');  // Add a 'locked' class for styling
  status.textContent = "Slider is locked and cannot be moved.";
}

function unlockSlider() {
  const slider = document.getElementById('slider');
  const status = document.getElementById('status');
  
  slider.disabled = false;  // Enable the slider again
  slider.classList.remove('locked');  // Remove the 'locked' class
  status.textContent = "Slider is active.";
}

    // Odměny při vysokém riziku (% hodnoty)
    const highRiskRewards = {
        1: 0,  // Prostřední díra
        2: 10,
        3: 20,
        4: 40,
        5: 200,
        6: 10000,
        7: 50000, // Krajní díry
    };

    // Normalizace rizika na rozsah 0–1
    const normalizedRisk = Math.min(Math.max(risk, 0), 99) / 99;

    // Lineární interpolace mezi nízkým a vysokým rizikem
    const lowReward = lowRiskRewards[holeNumber];
    const highReward = highRiskRewards[holeNumber];
    const percentageReward = lowReward + normalizedRisk * (highReward - lowReward);

    // Výpočet finální odměny (procenta přepočítaná na základě ceny kuličky)
    const reward = (percentageReward / 100) * ballPrice;

    return parseFloat(reward.toFixed(2)); // Zaokrouhlení na 2 desetinná místa
}

function riskChange() {
  document.getElementById("scoringText").innerHTML =
      (calculateReward(7, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(6, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(5, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(4, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(3, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(2, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(1, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(2, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(3, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(4, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(5, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(6, risk).toFixed(1)).padStart(5, '\u00a0') + "× " +
      (calculateReward(7, risk).toFixed(1)).padStart(5, '\u00a0') + "× "
}


// Function to be called when slider value changes
function updateSliderValue() {
		const slider = document.getElementById('slider');
		const valueDisplay = document.getElementById('sliderValue');
    const sliderValue = slider.value;  // Get the current value of the slider
    valueDisplay.textContent = sliderValue;  // Update the displayed value 
    risk = sliderValue
    riskChange()
}

// Set the event listener for when the slider changes
slider.addEventListener('input', updateSliderValue);


function lockSlider() {
  const slider = document.getElementById('slider');
  const status = document.getElementById('status');
  
  slider.disabled = true;  // Disable the slider
  slider.classList.add('locked');  // Add a 'locked' class for styling
  status.textContent = "You cannot change risk - ball is in game";
}

function unlockSlider() {
  const slider = document.getElementById('slider');
  const status = document.getElementById('status');
  
  slider.disabled = false;  // Enable the slider again
  slider.classList.remove('locked');  // Remove the 'locked' class
  status.textContent = "";
}

// Button click event to spawn a new ball
document.getElementById("spawnBtn").addEventListener("click", spawnBall)
document.getElementById("moneyCount").innerHTML = "Your Money: " + money.toFixed(1) + "$"
riskChange()

// Run the engine and renderer
engine.world.gravity.y = 2
Matter.Runner.run(engine)
Render.run(render)
