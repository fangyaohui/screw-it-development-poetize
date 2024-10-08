
this.$http.get(this.$constant.baseURL + "/blog/sortLabel/getListSortAndLabel")
  .then((res) => {
    if (!this.$common.isEmpty(res.data)) {
      this.sorts = res.data.sorts;
      this.labels = res.data.labels;
      if (!this.$common.isEmpty(this.id)) {
        this.getArticle();
      }
    }
  })
  .catch((error) => {
    this.$message({
      message: error.message,
      type: "error"
    });
  });