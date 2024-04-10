package ADS.test;

import com.microsoft.playwright.*;
import java.nio.file.Paths;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;

import java.lang.Thread;
import static com.microsoft.playwright.assertions.PlaywrightAssertions.assertThat;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public class Tests {

    private static final boolean headless = false;
    private static final double slowmo = 0.0;
    private static final int timeout = 120_000;
    private static Browser browser;

    public static void main(String[] args) {
        System.out.println("Working Directory = " + System.getProperty("user.dir"));
        try (Playwright playwright = Playwright.create()) {
            browser = playwright.firefox().launch(new BrowserType.LaunchOptions().setHeadless(headless).setSlowMo(slowmo));
           

            qrCodeDetectionTest();
            templateDownloadsTest();
            generatePDFDownloadsTest();
            cropTest();
            colorCorrectionTest(browser);


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
            page.getByText("Create Template").click();
        });

        InputStream is = download.createReadStream(); 
        byte[] bytes = new byte[1_000];
        is.read(bytes);
        String h = ECrypto.hex(ECrypto.hash(bytes));
        System.out.println(h);
        test(h.equals("15d331383ba5c8dde1d0b3c4d2fcb4d7d98b8e1a2fa386eed56d7a4653fccda1"));
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

    private static void colorCorrectionTest(Browser browser) throws Exception
    {
        Page page = browser.newPage();
        page.setDefaultTimeout(timeout);

        //File html = new File("../view/home.html"); 
        //page.navigate("file://"+html.getCanonicalPath());

        //File qrpng = new File("qrpage1_grey.png");
        // Initially assigning null 
		BufferedImage imgA = null; 
		BufferedImage imgB = null; 

		// Try block to check for exception 
		try { 

			// Reading file from local directory by 
			// creating object of File class 
			File fileA 
				= new File("qrpage1_grey.png"); 
			File fileB 
				= new File("qrpage1.png"); 

			// Reading files 
			imgA = ImageIO.read(fileA); 
			imgB = ImageIO.read(fileB); 
		} 

		// Catch block to check for exceptions 
		catch (IOException e) { 
			// Display the exceptions on console 
			System.out.println(e); 
		} 

		// Assigning dimensions to image 
		int width1 = imgA.getWidth(); 
		int width2 = imgB.getWidth(); 
		int height1 = imgA.getHeight(); 
		int height2 = imgB.getHeight(); 

		// Checking whether the images are of same size or 
		// not 
		if ((width1 != width2) || (height1 != height2)) 

			// Display message straightaway 
			System.out.println("Error: Images dimensions"
							+ " mismatch"); 
		else { 

			// By now, images are of same size 

			long difference = 0; 

			// treating images likely 2D matrix 

			// Outer loop for rows(height) 
			for (int y = 0; y < height1; y++) { 

				// Inner loop for columns(width) 
				for (int x = 0; x < width1; x++) { 

					int rgbA = imgA.getRGB(x, y); 
					int rgbB = imgB.getRGB(x, y); 
					int redA = (rgbA >> 16) & 0xff; 
					int greenA = (rgbA >> 8) & 0xff; 
					int blueA = (rgbA)&0xff; 
					int redB = (rgbB >> 16) & 0xff; 
					int greenB = (rgbB >> 8) & 0xff; 
					int blueB = (rgbB)&0xff; 

					difference += Math.abs(redA - redB); 
					difference += Math.abs(greenA - greenB); 
					difference += Math.abs(blueA - blueB); 
				} 
			} 

			// Total number of red pixels = width * height 
			// Total number of blue pixels = width * height 
			// Total number of green pixels = width * height 
			// So total number of pixels = width * height * 
			// 3 
			double total_pixels = width1 * height1 * 3; 

			// Normalizing the value of different pixels 
			// for accuracy 

			// Note: Average pixels per color component 
			double avg_different_pixels 
				= difference / total_pixels; 

			// There are 255 values of pixels in total 
			double percentage 
				= (avg_different_pixels / 255) * 100; 

            test(percentage == 49.579053429375584);
			// Lastly print the difference percentage 
			/*System.out.println("Difference Percentage-->"
							+ percentage); */
		} 
           /*  page.getByTestId("fileupload").setInputFiles(Paths.get(qrpng.getCanonicalPath()));

        // Perform the action that initiates download
        page.getByText("Generate PDF").click();*/
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
