import g4p_controls.*;

StatusController statusController = new StatusController();
Screen screen = new Screen(300, 500, color(255, 255, 255));

ArrayList<Question> questions = new ArrayList<Question>();

Question currentQ;
String currentDisplayed = "";

int i = 0;
int timeout = 0;
int frame = 0;
int padding = 20;

void setup() {
  String[] questionsData = loadStrings("data/questions.txt");
  
  createGUI();
  
  for (int i = 0; i < questionsData.length; i++) {
    String[] q = split(questionsData[i], ";");
    
    questions.add(new Question(q[0], q[1],(q[2] == "" ? q[1] : q[2])));
  }
  
  currentQ = questions.get(Math.round(random(0, questions.size())));
}

public void settings() {
  size(screen.width, screen.height);
}

void draw() { 
  background(screen.bg);
  
  fill(0);
  textSize(20);
  
  if (statusController.currentStatus == "not started") {
    text("Press the button below to start practice.", padding, 50 + padding, screen.width - padding, 300 - padding);
  } else if (statusController.currentStatus == "reading") {
    text(currentDisplayed, padding, 50 + padding, 280, 320);
    
    if (frame % 12 == 0 && i < currentQ.prompt.length) {
      currentDisplayed += currentQ.prompt[i] + " ";
      i++;
    }
  } else if (statusController.currentStatus == "buzzed") {
    text((timeout / 60), 280, 280);
    timeout++;
    if (timeout / 60 == 6) {
      statusController.timeout();
    }
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320);
  } else if (statusController.currentStatus == "stats") {
    text("Stats", padding, 50 + padding, screen.width - padding, 320);
  } else if (statusController.currentStatus == "settings") {
    text("Settings", padding, 50 + padding, screen.width - padding, 320);
  } else if (statusController.currentStatus == "timeout") {
    currentDisplayed = join(currentQ.prompt, " ");
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320);  
    text("Time's up! The correct answer was:", padding, 240, screen.width - padding, 280);
    text(currentQ.answer, padding, 280, screen.width - padding, 300);
  } else if (statusController.currentStatus == "correct") {
    currentDisplayed = join(currentQ.prompt, " ");
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320);
    text("Correct! The correct answer was:", padding, 240, screen.width - padding, 280);
    text(currentQ.answer, padding, 280, screen.width - padding, 300);
  } else if (statusController.currentStatus == "wrong") {
    currentDisplayed = join(currentQ.prompt, " ");
    text(currentDisplayed, padding, 50 + padding, screen.width - padding, 320);
    text("Wrong! The correct answer was:", padding, 240, screen.width - padding, 280);
    text(currentQ.answer, padding, 280, screen.width - padding, 300);
  }
  
  frame++;
}
