import operation0 from './album.js';
import operation1 from './album_detail_dynamic.js';
import operation2 from './album_new.js';
import operation3 from './album_sub.js';
import operation4 from './album_sublist.js';
import operation5 from './artist_album.js';
import operation6 from './artist_detail.js';
import operation7 from './artist_songs.js';
import operation8 from './artist_top_song.js';
import operation9 from './cloud_lyric_get.js';
import operation10 from './cloudsearch.js';
import operation11 from './fm_trash.js';
import operation12 from './history_recommend_songs.js';
import operation13 from './history_recommend_songs_detail.js';
import operation14 from './homepage_block_page.js';
import operation15 from './like.js';
import operation16 from './likelist.js';
import operation17 from './login_qr_key.js';
import operation18 from './login_status.js';
import operation19 from './logout.js';
import operation20 from './lyric_new.js';
import operation21 from './personal_fm_mode.js';
import operation22 from './personal_fm.js';
import operation23 from './personalized.js';
import operation24 from './playlist_detail.js';
import operation25 from './playlist_detail_dynamic.js';
import operation26 from './playlist_subscribe.js';
import operation27 from './playlist_track_all.js';
import operation28 from './playlist_tracks.js';
import operation29 from './recommend_resource.js';
import operation30 from './recommend_songs.js';
import operation31 from './recommend_songs_dislike.js';
import operation32 from './simi_song.js';
import operation33 from './song_chorus.js';
import operation34 from './song_copyright_rcmd.js';
import operation35 from './song_detail.js';
import operation36 from './top_playlist.js';
import operation37 from './top_song.js';
import operation38 from './toplist.js';
import operation39 from './user_account.js';
import operation40 from './user_cloud.js';
import operation41 from './user_cloud_detail.js';
import operation42 from './user_playlist.js';

// Statically bundled upstream route adapters.
export const upstreamRoutes: Record<string, (query: any, request: any) => Promise<any>> = {
    '/album': operation0,
    '/album/detail/dynamic': operation1,
    '/album/new': operation2,
    '/album/sub': operation3,
    '/album/sublist': operation4,
    '/artist/album': operation5,
    '/artist/detail': operation6,
    '/artist/songs': operation7,
    '/artist/top/song': operation8,
    '/cloud/lyric/get': operation9,
    '/cloudsearch': operation10,
    '/fm_trash': operation11,
    '/history/recommend/songs': operation12,
    '/history/recommend/songs/detail': operation13,
    '/homepage/block/page': operation14,
    '/like': operation15,
    '/likelist': operation16,
    '/login/qr/key': operation17,
    '/login/status': operation18,
    '/logout': operation19,
    '/lyric/new': operation20,
    '/personal/fm/mode': operation21,
    '/personal_fm': operation22,
    '/personalized': operation23,
    '/playlist/detail': operation24,
    '/playlist/detail/dynamic': operation25,
    '/playlist/subscribe': operation26,
    '/playlist/track/all': operation27,
    '/playlist/tracks': operation28,
    '/recommend/resource': operation29,
    '/recommend/songs': operation30,
    '/recommend/songs/dislike': operation31,
    '/simi/song': operation32,
    '/song/chorus': operation33,
    '/song/copyright/rcmd': operation34,
    '/song/detail': operation35,
    '/top/playlist': operation36,
    '/top/song': operation37,
    '/toplist': operation38,
    '/user/account': operation39,
    '/user/cloud': operation40,
    '/user/cloud/detail': operation41,
    '/user/playlist': operation42,
};
