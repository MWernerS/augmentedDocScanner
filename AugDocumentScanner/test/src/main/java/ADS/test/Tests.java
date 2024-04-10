package ADS.test;

import com.microsoft.playwright.*;
import java.nio.file.Paths;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import java.io.File;
import java.io.InputStream;

public class Tests {

    private static final boolean headless = false;
    private static final double slowmo = 0.0;
    private static final int timeout = 30_000;
    private static Browser browser;

    public static void main(String[] args) {
        System.out.println("Working Directory = " + System.getProperty("user.dir"));
        try (Playwright playwright = Playwright.create()) {
            browser = playwright.firefox().launch(new BrowserType.LaunchOptions().setHeadless(headless).setSlowMo(slowmo));
           

            qrCodeDetectionTest();
            templateDownloadsTest();
            generatePDFDownloadsTest();
            cropTest();


        }
        catch (TestFailure | PlaywrightException e)
        {
            throw e;
        }
        catch (Exception e)
        {
            e.printStackTrace();
        }
    }

    private static void qrCodeDetectionTest() throws Exception
    {
            Page page = browser.newPage();

            File html = new File("../view/home.html");
            File qrpng = new File("qr1.png");

            page.navigate("file://"+html.getCanonicalPath());
            page.getByTestId("fileupload").setInputFiles(Paths.get(qrpng.getCanonicalPath()));

            assertThat(page.getByTestId("qrresult")).hasText("QR point coordinates: (94, 206), (94, 134), (166, 134)");
            page.close();

    }

    private static void templateDownloadsTest() throws Exception
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
        byte[] bytes = new byte[1_000];
        is.read(bytes);
        String h = ECrypto.hex(ECrypto.hash(bytes));
        System.out.println(h);
        test(h.equals("8ee0f3fab3381d7eb8c4d64ed2654b423b1e8274f0e037ee29ec746438ad6495"));
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

    private static void generatePDFDownloadsTest() throws Exception
    {
        Page page = browser.newPage();
        page.setDefaultTimeout(timeout);

        File html = new File("../view/home.html"); 
        page.navigate("file://"+html.getCanonicalPath());

        File qrpng = new File("qr1.png");
        page.getByTestId("fileupload").setInputFiles(Paths.get(qrpng.getCanonicalPath()));

        // Wait for the download to start
        Download download = page.waitForDownload(() -> {
            // Perform the action that initiates download
            page.getByText("Generate PDF").click();
        });

        InputStream is = download.createReadStream(); 
        byte[] bytes = new byte[1_000];
        is.read(bytes);
        String h = ECrypto.hex(ECrypto.hash(bytes));
        System.out.println(h);
        test(h.equals("bdb09f9347b77eff97e3673837b566eccc17b51e317ad4ecee10e6f79158ae10"));
        page.close();
    }

    private static void cropTest() throws Exception
    {
        Page page = browser.newPage();
        page.setDefaultTimeout(timeout);

        File cropTestHtml = new File("croptest.html");
        page.navigate("file://"+cropTestHtml.getCanonicalPath());

        File inputPhoto = new File("qrpage8.jpg");
        page.getByTestId("fileupload").setInputFiles(Paths.get(inputPhoto.getCanonicalPath()));
        
        Locator outputText = page.getByText("done", new Page.GetByTextOptions().setExact(true));
        outputText.waitFor();

        Locator outputImage = page.getByTestId("finaloutputimage");
        outputImage.waitFor();
        System.out.println("output image innerhtml: "+ECrypto.hash(outputImage.innerHTML()));

        test("62135b1db1bcae13ab4a6b4321cc7dce8be2820fd6d8b9bb1e25687ece232c68".equals(ECrypto.hash(outputImage.innerHTML())));
    }
}
