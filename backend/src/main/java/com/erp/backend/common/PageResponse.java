package com.erp.backend.common;

import lombok.Getter;
import java.util.List;

@Getter
public class PageResponse<T> {
    private final List<T> list;
    private final int page;
    private final int size;
    private final int total;
    private final int totalPage;

    public PageResponse(List<T> list, int page, int size, int total) {
        this.list = list;
        this.page = page;
        this.size = size;
        this.total = total;
        this.totalPage = (total + size - 1) / size;}
    
}
