class Question {
  String[] prompt; // the question, split into words
  String answer; // the correct answer
  String required; // the required words that must be said from the answer (ie. "William Shakespeare", "Shakespeare" is required, "William" is optional)
  
  Question(String q, String a, String r) {
    this.prompt = q.split(" ");
    this.answer = a;
    this.required = r;
  }
  
  int distance(String s1, String s2) { // Damerau-Levenshtein distance, used to calculate the number of operations (replacement, adding, removing) a string needs to become a different string. In other words, it's how similar two strings are (0 - identical, 1,2 - similar, 3+ - different). This function isn't recursion or sorting, but it is dynamic programming. :)
    int l1 = s1.length(); // store lengths for use later
    int l2 = s2.length();
    
    // Create the distance matrix, a grid of size (l1 + 1) x (l2 + 1), which is used to store the cost of transforming the first i characters of s1 into the first j characters of s2
    int[][] distance = new int[l1 + 1][l2 + 1];
    
    // Initialize the distance matrix
    for (int i = 0; i <= l1; i++) {
      distance[i][0] = i;
    }
    for (int j = 0; j <= l2; j++) {
      distance[0][j] = j;
    }
    
    // Compute the distance
    for (int i = 1; i <= l1; i++) { // for each character in s1
      for (int j = 1; j <= l2; j++) { // for each character in s2
        int cost = (s1.charAt(i - 1) == s2.charAt(j - 1)) ? 0 : 1; // if the characters are the same, the cost is 0, otherwise it's 1
        distance[i][j] = min(
          distance[i - 1][j] + 1, // Deletion
          distance[i][j - 1] + 1, // Insertion
          distance[i - 1][j - 1] + cost // Substitution
         );// the cost of transforming the first i characters of userAnswer into the first j characters of answer is the minimum of the cost of deleting, inserting, or substituting the characters
        
        // Check for transposition (swapping two adjacent characters)
        if (i > 1 && j > 1 && s1.charAt(i - 1) == s2.charAt(j - 2) && s1.charAt(i - 2) == s2.charAt(j - 1)) {
          distance[i][j] = min(
            distance[i][j],
            distance[i - 2][j - 2] + cost // Transposition
           );
        }
      }
    }
    
    return distance[l1][l2]; // the distance between the two strings is the value in the bottom-right corner of the matrix
  }
  
  void checkAnswer(String userAnswer) { // use DL distance to check if an answer is correct. in this way, the user can make a typo and still get the answer right (ie. "Shakespear" instead of "Shakespeare")
    
    String s1 = userAnswer.toLowerCase(); // convert to lowercase to make the comparison case-insensitive
    String s2 = this.answer.toLowerCase();
    String s3 = this.required.toLowerCase();
    
    if (distance(s1, s2) <= 2 || distance(s1, s3) <= 2) { // if the distance between the user's answer and the correct answer is less than or equal to 2, the answer is correct (two or less operations are needed to transform the user's answer into the correct answer)
      statusController.correct();
    } else {
      statusController.wrong();
    }
  }
}