module.exports= (opts) => `<div id="container">
    <div class="talkbox" id="them-box">
        Give your friend this link:
        <a id="publiclink" href="${opts.publicLink}">${opts.publicLink}</a> <!-- <a href="#" id="copy-publiclink">[copy]</a> -->
    </div>
    <div class="talkbox" id="you-box">
    </div>
</div>`;
