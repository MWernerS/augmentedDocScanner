package ADS.test;

import com.microsoft.playwright.*;
import java.nio.file.Paths;
import java.lang.Thread;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import java.io.File;
import java.io.InputStream;

public class QRTest {

    private static final boolean headless = false;
    private static final double slowmo = 0.0;

    public static void main(String[] args) {
        System.out.println("Working Directory = " + System.getProperty("user.dir"));
        try (Playwright playwright = Playwright.create()) {
            Browser browser = playwright.firefox().launch(new BrowserType.LaunchOptions().setHeadless(headless).setSlowMo(slowmo));
           

            qrCodeDetectionTest(browser);
            templateDownloadsTest(browser);

        } catch (TestFailure e)
        {
            throw e;
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
    }

    private static void qrCodeDetectionTest(Browser browser) throws Exception
    {
            Page page = browser.newPage();

            File html = new File("../view/home.html");
            File qrpng = new File("qr1.png");

            page.navigate("file://"+html.getCanonicalPath());
            page.getByTestId("fileupload").setInputFiles(Paths.get(qrpng.getCanonicalPath()));

            assertThat(page.getByTestId("qrresult")).hasText("QR point coordinates: (94, 206), (94, 134), (166, 134)");
            page.close();

    }

    private static void templateDownloadsTest(Browser browser) throws Exception
    {
        Page page = browser.newPage();
        File html = new File("../view/pdfgen.html"); 
        page.navigate("file://"+html.getCanonicalPath());

        // Wait for the download to start
        Download download = page.waitForDownload(() -> {
            // Perform the action that initiates download
            page.getByText("Create PDF").click();
        });

        InputStream is = download.createReadStream(); 
        byte[] bytes = new byte[is.available()];
        is.read(bytes);
        String h = ECrypto.hex(ECrypto.hash(bytes));
        test(h.equals("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"));
        page.close();
    }

    private static void test(boolean b)
    {
        if(!b)
            throw new TestFailure("Assertion failed");
        else
            System.out.println("Test successful");
    }
    private static class TestFailure extends RuntimeException
    {
        public TestFailure()
        {
            super();
        }
        public TestFailure(String reason)
        {
            super(reason);
        }
    }
}
