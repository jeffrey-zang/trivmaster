import g4p_controls.*;

// initailize controller classes
StatusController statusController = new StatusController();
Stats statsController = new Stats();
Screen screen = new Screen(300, 500, color(255, 255, 255));

// initialize question list
ArrayList<Question> questions = new ArrayList<Question>();

Question currentQ; // the question that is currently being read
String currentDisplayed = ""; // the parts of the question that have already been displayed

int currentWord = 0; // the index of the last word that was displayed
int timeout = 0; // the amount of time that has passed since the user buzzed in
int frame = 0; // the current frame number
int padding = 20; // the padding around the text

void setup() {
  statsController.fetch(); // load stats from file
  
  createGUI();
  
  String[] questionsData = loadStrings("data/questions.txt"); // load questions from file
  
  for (int i = 0; i < questionsData.length; i++) { // parse questions
    String[] q = split(questionsData[i], ";");
    
    questions.add(new Question(q[0], q[1],(q[2] == "" ? q[1] : q[2])));
  }
  
  currentQ = questions.get(Math.round(random(0, questions.size()))); // select a random question
}

public void settings() {
  size(screen.width, screen.height);
}

void draw() { 
  background(screen.bg); // set background color
  
  // set text color and size
  fill(0);
  textSize(20);
  
  if (statusController.currentStatus == "not started") {
    text("Press the button below to start practice.", padding, 50 + padding, screen.width - padding, 300 - padding);
  } else if (statusController.currentStatus == "reading") {
    text(currentDisplayed, padding, 50 + padding, 280, 320);
    
    // every 12 frames (0.2 seconds), add a word to the displayed text
    if (frame % 12 == 0 && i < currentQ.prompt.length) {
      currentDisplayed += currentQ.prompt[i] + " ";
      i++;
    }
  } else if (statusController.currentStatus == "buzzed") { // if the user buzzed in, begin the timeout
    text((timeout / 60), 280, 280);
    timeout++;
    if (timeout / 60 == 6) { // if the timeout is over after 6 seconds, move to the next status
      statusController.timeout();
    }
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320); 
  } else if (statusController.currentStatus == "stats") { // display stats when on stats page
    text("Stats", padding, 50 + padding, screen.width - padding, 320);
    text("Correct: " + statsController.correct, padding, 80 + padding, screen.width - padding, 320);
    text("Wrong: " + statsController.wrong, padding, 100 + padding, screen.width - padding, 320);
    text("Percentage: " + statsController.getPercentage() + "%", padding, 120 + padding, screen.width - padding, 320);
    text("Timeout: " + statsController.timeout, padding, 140 + padding, screen.width - padding, 320);
    text("Total: " + statsController.getTotal(), padding, 160 + padding, screen.width - padding, 320);
  } else if (statusController.currentStatus == "timeout") { // display the answer when the timeout is over
    currentDisplayed = join(currentQ.prompt, " ");
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320);  
    text("Time's up! The answer was:", padding, 240, screen.width - padding, 280);
    text(currentQ.answer, padding, 260, screen.width - padding, 300);
  } else if (statusController.currentStatus == "correct") { // display the answer when the user is correct
    currentDisplayed = join(currentQ.prompt, " ");
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320);
    text("Correct! The answer was:", padding, 240, screen.width - padding, 280);
    text(currentQ.answer, padding, 260, screen.width - padding, 300);
  } else if (statusController.currentStatus == "wrong") { // display the answer when the user is wrong
    currentDisplayed = join(currentQ.prompt, " ");
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320);
    text("Wrong! The answer was:", padding, 240, screen.width - padding, 280);
    text(currentQ.answer, padding, 260, screen.width - padding, 300);
  }
  
  frame++; // increment the frame number
}
