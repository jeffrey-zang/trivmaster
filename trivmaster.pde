import g4p_controls.*;

StatusController statusController = new StatusController();
Screen screen = new Screen(300, 500, color(255, 255, 255));

ArrayList<Question> questions = new ArrayList<Question>();

Question currentQ;
String currentDisplayed = "";

int i = 0;
int timeout = 0;
int frame = 0;

void setup() {
  String[] questionsData = loadStrings("data/questions.txt");

  createGUI();
  
  for (int i = 0; i < questionsData.length; i++) {
    questions.add(new Question(split(questionsData[i], ";")[0], split(questionsData[i], ";")[1]));
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
    text("Press the button below to start practice.", 20, 70, 280, 320);
  } else if (statusController.currentStatus == "reading") {
    text(currentDisplayed, 20, 70, 280, 320);
  
    if (frame % 12 == 0 && i < currentQ.prompt.length) {
      currentDisplayed += currentQ.prompt[i] + " ";
      i++;
    }
  } else if (statusController.currentStatus == "buzzed") {
    text((timeout/60), 280, 280);
    timeout++;
    if (timeout/60 == 6) {
      statusController.timeout();
    }
    text(currentDisplayed, 20, 70, 280, 320);
  } else if (statusController.currentStatus == "stats") {
    text("Stats", 20, 70, 280, 320);
  } else if (statusController.currentStatus == "settings") {
    text("Settings", 20, 70, 280, 320);
  } else if (statusController.currentStatus == "timeout") {
    text(currentDisplayed, 20, 70, 280, 320);  
    text("Time's up!", 20, 280);
  } else if (statusController.currentStatus == "correct") {
    text(currentDisplayed, 20, 70, 280, 320);
    text("Correct! The correct answer was:", 20, 260);
    text(currentQ.answer, 20, 280);
  } else if (statusController.currentStatus == "wrong") {
    currentDisplayed = join(currentQ.prompt, " ");
    text(currentDisplayed, 20, 70, 280, 320);
    text("Wrong! The correct answer was:", 20, 260);
    text(currentQ.answer, 20, 280);
  }
  
  frame++;
}
