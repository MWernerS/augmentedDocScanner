package ADS.test;

import com.microsoft.playwright.*;
import java.nio.file.Paths;
import java.lang.Thread;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;

public class QRTest {

    private static final boolean headless = true;

    public static void main(String[] args) {
        System.out.println("Working Directory = " + System.getProperty("user.dir"));
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.firefox().launch(new BrowserType.LaunchOptions().setHeadless(headless));
            Page page = browser.newPage();

            page.navigate("file:///home/blake/Documents/School/Senior%202/COSC%20481W/augmentedDocScanner/ADS/view/home.html");
            page.getByTestId("fileupload").setInputFiles(Paths.get("/home/blake/Documents/School/Senior 2/COSC 481W/augmentedDocScanner/ADS/test/qr1.png"));
            assertThat(page.getByTestId("qrresult")).hasText("QR point coordinates: (94, 206), (94, 134), (166, 134)");
        }
    }
}
