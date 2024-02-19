package ADS.test;

import com.microsoft.playwright.*;
import java.nio.file.Paths;
import java.lang.Thread;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import java.io.File;

public class QRTest {

    private static final boolean headless = true;

    public static void main(String[] args) {
        System.out.println("Working Directory = " + System.getProperty("user.dir"));
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.firefox().launch(new BrowserType.LaunchOptions().setHeadless(headless));
            Page page = browser.newPage();

            File html = new File("../view/home.html");
            File qrpng = new File("qr1.png");

            page.navigate(html.getCanonicalPath());
            page.getByTestId("fileupload").setInputFiles(Paths.get(qrpng.getCanonicalPath()));
            assertThat(page.getByTestId("qrresult")).hasText("QR point coordinates: (94, 206), (94, 134), (166, 134)");
        }
    }
}
