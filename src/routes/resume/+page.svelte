<script>
	const pdfUrl = "/projects/Resume_4-2026.pdf";
</script>

<svelte:head>
	<title>Resume | Allison McCartney</title>
	<meta name="description" content="View and download Allison McCartney's resume." />
</svelte:head>

<section class="resume-shell">

    <header class="resume-header">
        <h1>Resume</h1>
    </header>


	<section class="resume-content">

		<div class="resume-row">
			<h3>Experience</h3>
            <div class="experiences">
                <div class="experience-item">
                    <h4>The New York Times</h4>
                    <p class="meta">Story Editor, Graphics and Data • <em>July 2022—Present</em></p>
                    <p class="description">
                        I edit web-based stories, data visualizations and interactive graphics covering elections and politics. This includes our live results pages for U.S. and international elections as well as live vote tracking in Congress, live political debate coverage and our COVID tracker. This work means coordinating between the newsroom, designers, developers and product teams. It requires proficiency with design tools like Figma, Illustrator and Photoshop, and Javascript tools like Node, D3, and Svelte. I regularly use AI tools like Copilot and Claude to help me manage my schedule and task list, spin up internal tools and write code for projects. Additionally, I manage two graphics reporters who also work on elections and politics.

                    </p>
                </div>
                <div class="experience-item">
                    <h4>Bloomberg News</h4>
                    <p class="meta">Special Projects Editor • <em>Nov. 2020—July 2022</em></p>
                    <p class="description">
                        Managed 2020 live election graphics coverage for the newsroom. Led a team of six to design and develop our results pages. Designed and developed visualizations on subjects ranging from fracking to political analysis to cruise ships sailing during the pandemic. 
                    </p>
                </div>
                <div class="experience-item">
                    <p class="meta">Graphics Developer • <em>Feb. 2018—Nov. 2020</em></p>
                    <p class="description">
                        Created visualizations for daily news coverage and long term projects using a wide-ranging set of tools from Node, D3, Svelte and QGIS to Adobe Illustrator and Cinema 4D. Managed 2018 election live results visualizations and AP election API feeds to the breaking news team.
                    </p>
                </div>
                <div class="experience-item">
                    <h4>ProPublica</h4>
                    <p class="meta">Politics News Apps Developer • <em>May 2017—Dec. 2017</em></p>
                    <p class="description">
                        Redesigned and developed the front end UI, UX and data visualizations for ProPublica’s Represent app, a leading resource for Congressional data.
                    </p>
                </div>
                <div class="experience-item">
                    <h4>The Brown Institute for Media Innovation</h4>
                    <p class="meta">Program Developer • <em>July 2016—May 2017</em></p>
                    <p class="meta">Magic Grant Recipient • <em>Aug. 2015—July 2016</em></p>
                </div>
                <div class="experience-item">
                    <h4>The Center for Investigative Reporting</h4>
                    <p class="meta">Data Fellow • <em>June 2015—Sept. 2015</em></p>
                </div>
                <div class="experience-item">
                    <h4>The PBS NewsHour</h4>
                    <p class="meta">Editor, PBS NewsHour Extra • <em>April 2013—July 2014</em></p>
                    <p class="meta">Assistant Editor, Education • <em>June 2012—April 2013</em></p>
                </div>
            </div>
		</div>

		<div class="resume-row">
			<h3>Education</h3>
            <div class="experiences">
                <div class="experience-item">
                    <h4>Stanford University</h4>
                    <p class="meta">M.A.—Journalism, <em>2015</em></p>
                </div>
                
                <div class="experience-item">
                    <h4>Washington University in St. Louis</h4>
                    <p class="meta">B.A.—Middle Eastern Studies & Printmaking, <em>2012</em></p>
                </div>
            </div>
		</div>

        <div class="resume-row">
            <h3>Selected Awards</h3>
            <div class="experiences">
                <ul>
                    <li>2019 duPont-Columbia Award Winner</li>
                    <li>2016 News and Documentary Emmy Award Winner</li>
                    <li>2016 National Edward R. Murrow Award Winner</li>
                    <li>2016 Society of Professional Journalists Awards</li>
                    <li>2015: Brown Institute Magic Grant Recipient</li>
                </ul>
            </div>
        </div>

         <div class="resume-row">
            <h3>Courses Taught</h3>
                <div class="experiences">   
                    <ul>
                        <li>2026: U.C. Berkeley School of Journalism—Interactive Narratives</li>
                        <li>2021: Columbia University School of Journalism—Intro to Data Visualization</li>
                        <li>2016: U.C. Berkeley School of Journalism—New Media Master’s Project Workshop</li>
                    </ul>
            </div>
        </div>

	</section>
    <div class="resume-header">
		<a class="download-link" href={pdfUrl} target="_blank" rel="noopener noreferrer">
			Download Resume (PDF)
		</a>
	</div>
</section>

	

<style>
	.resume-shell {
		max-width: 800px;
		margin: 2rem auto 4rem;
		padding: 0 1.25rem;
	}


	.resume-header {
		margin-bottom: 1rem;
	}

	.resume-header h1 {
		font-weight: bold;
        color: var(--olivetti-charcoal);
        letter-spacing: -1px;
        font-size: 30px;
        margin:0 0 12px;
	}

	.resume-header p {
		margin-bottom: 1rem;
		color: var(--olivetti-charcoal);
	}

	.download-link {
		display: inline-block;
		padding: 0.65rem 1rem;
		color: var(--olivetti-charcoal);
        border: 1px solid var(--olivetti-orange);
		border-radius: 8px;
		text-decoration: none;
		font-weight: 600;
	}

	.resume-row + .resume-row {
		margin-top: 1.25rem;
	}

	.resume-row h4 {
		margin: 0 0 0.5rem;
	}

	.resume-row h3 {
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0.35rem;
        margin-bottom: 0;
        color: var(--olivetti-orange);
        text-transform: uppercase;
        letter-spacing: 1px;
	}

    .experiences div:first-child {
        margin-top: 10px;
    }  
    .experiences {
        margin-bottom: 40px;
    } 

	.experience-item {
		margin-top: 30px;
	}
    .experience-item h4 {
        font-weight: 600;
        margin: 0 0 5px;
    }

	.experiences li,
    .experience-item .meta {
		font-size: 0.9rem;
		color: var(--olivetti-charcoal);
		margin: 0 0 5px;
	}
    .experience-item .description {
        margin: 0 0 20px;
        color: var(--olivetti-charcoal);
        line-height: 1.5;
    }
	.resume-row ul {
		padding-left: 1.1rem;
		margin: 0.4rem 0 0;
	}

	.resume-row li {
		margin-bottom: 0.45rem;
	}

	@media (min-width: 800px) {
		.resume-header h1 {
            font-size: 36px;
        }
	}
</style>
