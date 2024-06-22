import g4p_controls.*;

StatusController statusController = new StatusController();
Screen screen = new Screen(300, 500, color(255, 255, 255));


ArrayList<String[]> questions = new ArrayList<String[]>();

void setup() {
  String[] questionsData = loadStrings("data/questions.txt");

  createGUI();
  
  for (int i = 0; i < questionsData.length; i++) {
    println(questionsData[i]);
    questions.add(split(questionsData[i][1], ";"));
  }
  println(questions);
}

public void settings() {
  size(screen.width, screen.height);
}

String[] currentQ = {"", ""};
int i = 0;
int timeout = 0;
int frame = 0;
String current = "";

void draw() { 
  background(screen.bg);
  
  fill(0);
  textSize(20);
  
  if (statusController.currentStatus == "not started") {
    text("Press the button below to start practice.", 20, 70, 280, 320);
  } else if (statusController.currentStatus == "reading") {
    text(current, 20, 70, 280, 320);  
  
    if (frame % 12 == 0 && i < currentQ[0].length()) {
      // current += q[i] + " ";
      i++;
    }
  } else if (statusController.currentStatus == "buzzed") {
    text((timeout/60), 280, 280);
    timeout++;
    if (timeout/60 == 6) {
      statusController.timeout();
    }
    text(current, 20, 70, 280, 320);
  } else if (statusController.currentStatus == "stats") {
    text("Stats", 20, 70, 280, 320);
  } else if (statusController.currentStatus == "settings") {
    text("Settings", 20, 70, 280, 320);
  } else if (statusController.currentStatus == "timeout") {
    text(current, 20, 70, 280, 320);  
    text("Time's up!", 20, 280);
  } else if (statusController.currentStatus == "correct") {
    text(current, 20, 70, 280, 320);  
    text("Correct!", 20, 280);
  } else if (statusController.currentStatus == "wrong") {
    text(current, 20, 70, 280, 320);  
    text("Wrong!", 20, 280);
  }
  
  frame++;
}
