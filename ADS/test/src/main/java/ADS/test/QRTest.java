package ADS.test;

import com.microsoft.playwright.*;
import java.nio.file.Paths;
import java.lang.Thread;

public class QRTest {
    public static void main(String[] args) {
        System.out.println("Working Directory = " + System.getProperty("user.dir"));
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.firefox().launch();
            Page page = browser.newPage();

            page.onConsoleMessage(msg -> {
                System.out.println("Console output: "+msg.text());
            });

            page.navigate("file:///home/blake/Documents/School/Senior%202/COSC%20481W/augmentedDocScanner/ADS/view/home.html");

           
            // Select one file
            System.out.println("Uploading file...");
            page.getByTestId("fileupload").setInputFiles(Paths.get("/home/blake/Documents/School/Senior 2/COSC 481W/augmentedDocScanner/ADS/test/qr1.png"));
            System.out.println("Uploaded file");
            //expectConsoleMessage( equalTo("https://emich.edu/") );

            try {
                Thread.sleep(3000);
            } catch (Exception e)
            {
                e.printStackTrace();
            }

        }
    }
}
