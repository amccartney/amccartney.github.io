---
layout: page
title: Illustrations
permalink: /illustrations/
meta: Illustrations - Allison McCartney
---

<div class="ImageGrid">
    <a data-fancybox="gallery" href="/img/portfolio_images/trial_by_fire.png" data-caption="Illustration for Reveal's 'Trial by fire' episode.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/trial_by_fire.png"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/trump.png" data-caption="Illustration for Reveal's 'Pumped on Trump' episode.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/trump.png"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/food_illo.png" data-caption="Illustration for Reveal's 'Farm to fork' episode, which exposed the pathways that our food take on the way to the supermarket.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/food_illo.png"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/school_pollution.png" data-caption="Illustration for Reveal's 'School haze' episode.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/school_pollution.png"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/child_abuse.png" data-caption="Visual explanation of some of the abusive actions taken by care providers at religious day cares. Produced for a Reveal investigation.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/child_abuse.png"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/badges.png" data-caption="Badges created for the PBS NewsHour's Student Reporting Labs program. Part of Mozilla's Open Badges program.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/badges.png"></a>
</div>

My illustrations were paired with the work of a reporter to tell the story of a plea deal gone bad for Reveal in a 21-part series on Instagram. You can see the illustrations below, or see the images with the original reporting [here](https://www.instagram.com/explore/tags/badpleadeals/).

<div id="igSeries" class="ImageGrid">
    
</div>


## Art

Although I now work as a journalist and developer, I used to be a printmaker/painter and enjoy bringing those aesthetics and techniques into my graphic work when I can. Here's a sample of that work.

<div class="ImageGrid">
    <a data-fancybox="gallery" href="/img/portfolio_images/florence_sketch1.jpg" data-caption="Pencil and paper sketch from the Uffizi Galleries in Florence, Italy.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/florence_sketch1.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/portrait.jpg" data-caption="Pencil and paper portrait.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/portrait.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/Engine1.jpg" data-caption="Layered collograph depicting an engine.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/Engine1.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/pastel_after_currin.jpg" data-caption="Portrait, and Currin portrait copy. Blue and orange pastels on blue paper.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/pastel_after_currin.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/painting.jpg" data-caption="Oil on canvas. Election night 2012 in Washington DC.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/painting.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/diagram1.jpg" data-caption="Collograph and silkscreen depicting a mechanical diagram without its subject.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/diagram1.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/diagram3.jpg" data-caption="Collograph and silkscreen depicting a mechanical diagram without its subject.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/diagram3.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/engine3.jpg" data-caption="Steel plate intaglio depicting an engine and wires.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/engine3.jpg"></a>
    <a data-fancybox="gallery" href="/img/portfolio_images/lock1.jpg" data-caption="Collograph and pencil drawing composition.">
        <img class="lazyload" data-original="/img/portfolio_images/thumbnails/lock1.jpg"></a>
</div>

<script type="text/javascript">
    var baseUrl = 'https://www.instagram.com/p/';
    var urls = [
        `${baseUrl}BJali-hh9tK`,
        `${baseUrl}BJbH8ARhH2N`,
        `${baseUrl}BJbctNTB792`,
        `${baseUrl}BJdab6LBVR-`,
        `${baseUrl}BJdmF-rBGcI`,
        `${baseUrl}BJeHNUrh6jL`,
        `${baseUrl}BJf5ZX2B9yH`,
        `${baseUrl}BJgX_K1B8ET`,
        `${baseUrl}BJgiYDChEkz`,
        `${baseUrl}BJiwZhbhDiV`,
        `${baseUrl}BJi48n-ho0N`,
        `${baseUrl}BJjOKDJBo7i`,
        `${baseUrl}BJlEzZ9BWEN`,
        `${baseUrl}BJlcZVYBpAZ`,
        `${baseUrl}BJly27RBCrB`,
        `${baseUrl}BJnqdNlBXsB`,
        `${baseUrl}BJn_MDQhITh`,
        `${baseUrl}BJokQIDBZD8`,
        `${baseUrl}BJqMFaDB6bm`,
        `${baseUrl}BJqd3k2BvBm`,
        `${baseUrl}BJq7A-lhJU7`
    ];

    var oembedPromise = (url) => {
        var proxyUrl = "https://cors-anywhere.herokuapp.com";
        var oembedEndpoint = `https://api.instagram.com/oembed/?url=${url}`;
        var urlToFetch = `${proxyUrl}/${oembedEndpoint}`;
        // console.log(oembedEndpoint);
        return new Promise((resolve, reject) => {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", urlToFetch);
            xhr.onload = () => resolve(xhr.responseText);
            xhr.onerror = () => reject(xhr.statusText);
            xhr.send();
        });
    };

    var igPromises = urls.map(url => {
        return oembedPromise(url);
    });

    var igImagesArr = (oembedsArr) => {
        return oembedsArr.map(oembed => {
            return JSON.parse(oembed).thumbnail_url;
        }
    )};

    const igImageTmplt = (img) => {
        return (
            `<a data-fancybox="gallery" href="${img}">
                <img class="lazyload" src="${img}" data-original="${img}">
            </a>`
        );
    };

    var igSeriesElement = document.getElementById("igSeries");
    var htmlParser = new DOMParser()
    Promise.all(igPromises)
        .then(oembedsArr => {
            arr = igImagesArr(oembedsArr);

            for ( var i = 0; i < arr.length; i++ ) {
                
                var img = arr[i];
                var template = igImageTmplt(img);
                var currEl = document.createRange()
                    .createContextualFragment(template);
                igSeriesElement.appendChild(currEl);
            }

        })
        .catch(reason => {
            console.error(reason);
        });
</script>